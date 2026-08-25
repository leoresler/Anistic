import type { FastifyPluginAsync } from "fastify";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { animeEpisodes, animeGenres, animes, createDb, userAnimeLists, userAnimeProgress } from "@template/database";
import {
  animeProgressBodySchema,
  animeFormats,
  animeSeasons,
  animeSorts,
  animeStatuses,
  sortOrders,
  userAnimeListBodySchema,
  userAnimeListStatusSchema,
  type AnimeFormat,
  type AnimeSort,
  type SortOrder,
} from "@template/shared";

import { env } from "../env";
import { getAuthUserId, getOptionalAuthUserId, requireAuth, tryAuth } from "../lib/auth";
import { getAnimeById, getAnimeStats, listAnimeGenres, listAnimes } from "../services/anime.service";
import { recordUserEvent } from "../services/event.service";
import { getBecauseYouWatched, getContinueWatching, getPopularCommunity, getTopWeek } from "../services/recommendation.service";

type AnimeQuery = Record<string, string | string[] | undefined>;

const { db } = createDb(env.DATABASE_URL);

export const publicRouteAnimeFilter = eq(animes.hidden, false);

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const parseIntParam = (value: string | string[] | undefined, fallback?: number) => {
  const parsed = Number.parseInt(first(value) ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseGenres = (value: string | string[] | undefined) => {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return values
    .flatMap((entry) => entry.split(","))
    .map((genre) => genre.trim())
    .filter(Boolean);
};

const isOneOf = <T extends readonly string[]>(value: string | undefined, options: T): value is T[number] =>
  Boolean(value && options.includes(value));

export const parseAnimeListQuery = (query: AnimeQuery) => {
  const page = Math.max(1, parseIntParam(query.page, 1) ?? 1);
  const limit = Math.min(48, Math.max(1, parseIntParam(query.limit, 24) ?? 24));
  const sort = isOneOf(first(query.sort), animeSorts) ? (first(query.sort) as AnimeSort) : "relevance";
  const defaultOrder = sort === "rank" ? "asc" : "desc";
  const order = isOneOf(first(query.order), sortOrders) ? (first(query.order) as SortOrder) : defaultOrder;
  const status = isOneOf(first(query.status), animeStatuses) ? first(query.status) : undefined;
  const season = isOneOf(first(query.season), animeSeasons) ? first(query.season) : undefined;
  const format = isOneOf(first(query.format), animeFormats) ? (first(query.format) as AnimeFormat) : undefined;

  return {
    page,
    limit,
    search: first(query.search)?.trim() || undefined,
    genres: parseGenres(query.genre),
    status,
    format,
    year: parseIntParam(query.year),
    season,
    sort,
    order,
  };
};

const animeCardSql = sql`
  json_build_object(
    'id', ${animes.id},
    'title', ${animes.title},
    'titleEnglish', ${animes.titleEnglish},
    'titleJapanese', ${animes.titleJapanese},
    'synopsis', ${animes.synopsis},
    'imageUrl', ${animes.imageUrl},
    'bannerUrl', ${animes.bannerUrl},
    'trailerUrl', ${animes.trailerUrl},
    'episodes', ${animes.episodes},
    'status', ${animes.status},
    'score', ${animes.score},
    'scoredBy', ${animes.scoredBy},
    'rank', ${animes.rank},
    'popularity', ${animes.popularity},
    'anilistId', ${animes.anilistId},
    'format', ${animes.format},
    'countryOfOrigin', ${animes.countryOfOrigin},
    'startDate', ${animes.startDate},
    'averageScore', ${animes.averageScore},
    'anilistPopularity', ${animes.anilistPopularity},
    'trending', ${animes.trending},
    'relevanceScore', ${animes.relevanceScore},
    'year', ${animes.year},
    'season', ${animes.season},
    'studio', ${animes.studio},
    'rating', ${animes.rating},
    'duration', ${animes.duration},
    'source', ${animes.source},
    'malId', ${animes.malId},
    'hidden', ${animes.hidden},
    'syncedAt', ${animes.syncedAt},
    'createdAt', ${animes.createdAt},
    'genres', coalesce((select array_agg(${animeGenres.genre} order by ${animeGenres.genre}) from ${animeGenres} where ${animeGenres.animeId} = ${animes.id}), '{}')
  )
`;

const ensurePlaceholderEpisodes = async (animeId: number) => {
  const anime = await db.query.animes.findFirst({ where: eq(animes.id, animeId) });
  if (!anime?.episodes || anime.episodes < 1) return;

  await db.execute(sql`
    insert into ${animeEpisodes} (anime_id, season, episode, title)
    select ${animeId}, 1, generated_episode, 'Episodio ' || generated_episode
    from generate_series(1, ${anime.episodes}) generated_episode
    on conflict (anime_id, season, episode) do nothing
  `);
};

const listRows = async (userId: string, status?: z.infer<typeof userAnimeListStatusSchema>) =>
  db
    .select({ list: userAnimeLists, anime: { id: animes.id, title: animes.title, titleEnglish: animes.titleEnglish, imageUrl: animes.imageUrl, episodes: animes.episodes, score: animes.score, malId: animes.malId, year: animes.year, status: animes.status } })
    .from(userAnimeLists)
    .innerJoin(animes, eq(animes.id, userAnimeLists.animeId))
    .where(status ? and(eq(userAnimeLists.userId, userId), eq(userAnimeLists.status, status), publicRouteAnimeFilter) : and(eq(userAnimeLists.userId, userId), publicRouteAnimeFilter))
    .orderBy(desc(userAnimeLists.updatedAt));

const listSummaries = async (userId: string | null) => {
  if (!userId) return { watching: [], completed: [], pending: [] };
  const rows = await listRows(userId);
  return {
    watching: rows.filter((row) => row.list.status === "watching").slice(0, 8),
    completed: rows.filter((row) => row.list.status === "completed").slice(0, 8),
    pending: rows.filter((row) => row.list.status === "pending").slice(0, 8),
  };
};

const animeRoutes: FastifyPluginAsync = async (app) => {
  app.get("/discovery", { preHandler: tryAuth }, async (request) => {
    const userId = getOptionalAuthUserId(request);

    try {
      const [continueWatching, topWeek, newEpisodesRows, popularRows, lists, becauseYouWatched] = await Promise.all([
        getContinueWatching(userId).catch((error) => { request.log.error({ err: error }, "[discovery] getContinueWatching failed"); return []; }),
        getTopWeek().catch((error) => { request.log.error({ err: error }, "[discovery] getTopWeek failed"); return { fallback: true, items: [] as { anime: unknown; score: number; reasons: string[] }[] }; }),
        db.execute<{ anime: unknown; latestEpisode: number | null; latestAiredAt: Date | null }>(sql`
          select ${animeCardSql} as anime, max(${animeEpisodes.episode})::int as "latestEpisode", max(${animeEpisodes.airedAt}) as "latestAiredAt"
          from ${animes}
          left join ${animeEpisodes} on ${animeEpisodes.animeId} = ${animes.id}
          where ${publicRouteAnimeFilter} and (${animes.status} = 'Airing' or ${animeEpisodes.airedAt} is not null)
          group by ${animes.id}
          order by max(${animeEpisodes.airedAt}) desc nulls last, ${animes.syncedAt} desc
          limit 12
        `).catch((error) => { request.log.error({ err: error }, "[discovery] newEpisodes query failed"); return { rows: [] as { anime: unknown; latestEpisode: number | null; latestAiredAt: Date | null }[] }; }),
        getPopularCommunity().catch((error) => { request.log.error({ err: error }, "[discovery] getPopularCommunity failed"); return []; }),
        listSummaries(userId).catch((error) => { request.log.error({ err: error }, "[discovery] listSummaries failed"); return { watching: [], completed: [], pending: [] }; }),
        getBecauseYouWatched(userId).catch((error) => { request.log.error({ err: error }, "[discovery] getBecauseYouWatched failed"); return { sourceGenres: [], sourceStudios: [], items: [] as { anime: unknown; score: number; reasons: string[] }[] }; }),
      ]);

      return {
        continueWatching,
        topWeek,
        newEpisodes: newEpisodesRows.rows,
        becauseYouWatched: {
          ...becauseYouWatched,
          anime: becauseYouWatched.items.map((item) => item.anime),
        },
        popularAmongUsers: popularRows,
        lists,
      };
    } catch (error) {
      request.log.error({ err: error }, "[discovery] Unhandled error");
      throw error;
    }
  });

  app.get("/animes", async (request) => {
    return listAnimes(parseAnimeListQuery(request.query as AnimeQuery));
  });

  app.get("/animes/genres", async () => ({ genres: await listAnimeGenres() }));

  app.get("/animes/stats", async () => getAnimeStats());

  app.get("/animes/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const anime = await getAnimeById(Number.parseInt(id, 10));

    if (!anime) {
      return reply.status(404).send({ message: "Anime no encontrado" });
    }

    return anime;
  });

  app.get("/animes/:id/episodes", async (request, reply) => {
    const animeId = Number.parseInt((request.params as { id: string }).id, 10);
    if (!Number.isFinite(animeId)) return reply.status(400).send({ message: "Anime inválido" });

    await ensurePlaceholderEpisodes(animeId);
    return db.select().from(animeEpisodes).where(eq(animeEpisodes.animeId, animeId)).orderBy(asc(animeEpisodes.season), asc(animeEpisodes.episode));
  });

  app.get("/animes/:id/progress", { preHandler: requireAuth }, async (request, reply) => {
    const userId = getAuthUserId(request);
    const animeId = Number.parseInt((request.params as { id: string }).id, 10);

    if (!Number.isFinite(animeId)) return reply.status(400).send({ message: "Anime inválido" });

    const rows = await db
      .select()
      .from(userAnimeProgress)
      .where(and(eq(userAnimeProgress.userId, userId), eq(userAnimeProgress.animeId, animeId)))
      .orderBy(asc(userAnimeProgress.season), asc(userAnimeProgress.episode));

    const continueWatching = rows
      .filter((row) => !row.watched && row.progressSeconds > 0)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0] ?? null;

    return { progress: rows, continueWatching };
  });

  app.put("/animes/:id/progress", { preHandler: requireAuth }, async (request, reply) => {
    const userId = getAuthUserId(request);
    const animeId = Number.parseInt((request.params as { id: string }).id, 10);
    const body = animeProgressBodySchema.safeParse(request.body);

    if (!Number.isFinite(animeId)) return reply.status(400).send({ message: "Anime inválido" });
    if (!body.success) return reply.status(400).send({ message: "Progreso inválido" });

    const anime = await db.query.animes.findFirst({ where: eq(animes.id, animeId) });
    if (!anime) return reply.status(404).send({ message: "Anime no encontrado" });

    const durationSeconds = body.data.durationSeconds ?? 0;
    const watched = body.data.watched ?? (durationSeconds > 0 && body.data.progressSeconds >= durationSeconds * 0.9);
    const existingProgress = await db.query.userAnimeProgress.findFirst({
      where: and(eq(userAnimeProgress.userId, userId), eq(userAnimeProgress.animeId, animeId), eq(userAnimeProgress.season, body.data.season), eq(userAnimeProgress.episode, body.data.episode)),
    });
    const [row] = await db
      .insert(userAnimeProgress)
      .values({
        userId,
        animeId,
        season: body.data.season,
        episode: body.data.episode,
        durationSeconds,
        progressSeconds: body.data.progressSeconds,
        watched,
      })
      .onConflictDoUpdate({
        target: [userAnimeProgress.userId, userAnimeProgress.animeId, userAnimeProgress.season, userAnimeProgress.episode],
        set: {
          durationSeconds,
          progressSeconds: body.data.progressSeconds,
          watched,
          updatedAt: sql`now()`,
        },
      })
      .returning();

    const shouldRecordCompleted = watched && !existingProgress?.watched;
    const shouldRecordStarted = !watched && body.data.progressSeconds > 0 && !existingProgress;
    if (shouldRecordCompleted || shouldRecordStarted) {
      await recordUserEvent({
        userId,
        animeId,
        eventType: shouldRecordCompleted ? "episode_completed" : "episode_started",
        season: body.data.season,
        episode: body.data.episode,
        metadata: { progressSeconds: body.data.progressSeconds, durationSeconds },
      });
    }

    return row;
  });

  app.get("/me/continue-watching", { preHandler: requireAuth }, async (request) => {
    const userId = getAuthUserId(request);

    return db
      .select({
        progress: userAnimeProgress,
        anime: {
          id: animes.id,
          title: animes.title,
          titleEnglish: animes.titleEnglish,
          imageUrl: animes.imageUrl,
          episodes: animes.episodes,
          score: animes.score,
          malId: animes.malId,
          year: animes.year,
        },
      })
      .from(userAnimeProgress)
      .innerJoin(animes, eq(animes.id, userAnimeProgress.animeId))
      .where(and(eq(userAnimeProgress.userId, userId), eq(userAnimeProgress.watched, false), publicRouteAnimeFilter))
      .orderBy(desc(userAnimeProgress.updatedAt))
      .limit(8);
  });

  app.get("/me/lists", { preHandler: requireAuth }, async (request, reply) => {
    const status = first((request.query as AnimeQuery).status);
    if (status && !userAnimeListStatusSchema.safeParse(status).success) return reply.status(400).send({ message: "Estado de lista inválido" });
    return listRows(getAuthUserId(request), status as z.infer<typeof userAnimeListStatusSchema> | undefined);
  });

  app.put("/animes/:id/list", { preHandler: requireAuth }, async (request, reply) => {
    const userId = getAuthUserId(request);
    const animeId = Number.parseInt((request.params as { id: string }).id, 10);
    const body = userAnimeListBodySchema.safeParse(request.body);

    if (!Number.isFinite(animeId)) return reply.status(400).send({ message: "Anime inválido" });
    if (!body.success) return reply.status(400).send({ message: "Lista inválida" });
    const anime = await db.query.animes.findFirst({ where: eq(animes.id, animeId) });
    if (!anime) return reply.status(404).send({ message: "Anime no encontrado" });

    const [row] = await db
      .insert(userAnimeLists)
      .values({ userId, animeId, status: body.data.status })
      .onConflictDoUpdate({
        target: [userAnimeLists.userId, userAnimeLists.animeId],
        set: { status: body.data.status, updatedAt: sql`now()` },
      })
      .returning();

    await recordUserEvent({ userId, animeId, eventType: "list_added", metadata: { status: body.data.status } });
    return row;
  });

  app.delete("/animes/:id/list", { preHandler: requireAuth }, async (request, reply) => {
    const userId = getAuthUserId(request);
    const animeId = Number.parseInt((request.params as { id: string }).id, 10);
    if (!Number.isFinite(animeId)) return reply.status(400).send({ message: "Anime inválido" });

    await db.delete(userAnimeLists).where(and(eq(userAnimeLists.userId, userId), eq(userAnimeLists.animeId, animeId)));
    return { ok: true };
  });
};

export default animeRoutes;
