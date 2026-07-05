import type { FastifyPluginAsync } from "fastify";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { animeGenres, animes, createDb, userAnimeLists, userAnimeProgress } from "@template/database";
import {
  animeProgressBodySchema,
  animeSeasons,
  animeSorts,
  animeStatuses,
  animeVisibilityBodySchema,
  sortOrders,
  userAnimeListBodySchema,
  userAnimeListStatusSchema,
  type AnimeSort,
  type SortOrder,
} from "@template/shared";

import { env } from "../env";
import { getAuthUserId, getOptionalAuthUserId, isAdminUser, requireAdmin, requireAuth, tryAuth } from "../lib/auth";
import { getAnimeById, getAnimeStats, listAnimeGenres, listAnimes } from "../services/anime.service";
import { buildAnimeCardSql } from "../services/animeSql";
import { recordUserEvent } from "../services/event.service";
import { getBecauseYouWatched, getContinueWatching, getPopularCommunity, getTopWeek } from "../services/recommendation.service";
import { getEpisodesFlat, getEpisodesPaged, JikanRateLimitError } from "../services/jikanEpisodes.service";

type AnimeQuery = Record<string, string | string[] | undefined>;

const { db } = createDb(env.DATABASE_URL);

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

const animeCardSql = buildAnimeCardSql();

const listRows = async (userId: string, status?: z.infer<typeof userAnimeListStatusSchema>) =>
  db
    .select({ list: userAnimeLists, anime: { id: animes.id, title: animes.title, titleEnglish: animes.titleEnglish, imageUrl: animes.imageUrl, episodes: animes.episodes, score: animes.score, malId: animes.malId, year: animes.year, status: animes.status } })
    .from(userAnimeLists)
    .innerJoin(animes, eq(animes.id, userAnimeLists.animeId))
    .where(status ? and(eq(userAnimeLists.userId, userId), eq(userAnimeLists.status, status)) : eq(userAnimeLists.userId, userId))
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
    const viewerIsAdmin = await isAdminUser(request);

    try {
      const [continueWatching, topWeek, newEpisodesRows, popularRows, lists, becauseYouWatched] = await Promise.all([
        getContinueWatching(userId).catch((error) => { request.log.error({ err: error }, "[discovery] getContinueWatching failed"); return []; }),
        getTopWeek(viewerIsAdmin).catch((error) => { request.log.error({ err: error }, "[discovery] getTopWeek failed"); return { source: "fallback" as const, fallback: true, items: [] as { anime: unknown; score: number; reasons: string[] }[] }; }),
        db.execute<{ anime: unknown; latestEpisode: null; latestAiredAt: null }>(sql`
          select ${animeCardSql} as anime, null::int as "latestEpisode", null as "latestAiredAt"
          from ${animes}
          where ${animes.status} = 'Airing'
            ${viewerIsAdmin ? sql`` : sql`and ${animes.hidden} = false`}
            and ${animes.startDate} >= now() - interval '30 days'
          order by ${animes.startDate} desc nulls last
          limit 12
        `).catch((error) => { request.log.error({ err: error }, "[discovery] newEpisodes query failed"); return { rows: [] as { anime: unknown; latestEpisode: null; latestAiredAt: null }[] }; }),
        getPopularCommunity(viewerIsAdmin).catch((error) => { request.log.error({ err: error }, "[discovery] getPopularCommunity failed"); return []; }),
        listSummaries(userId).catch((error) => { request.log.error({ err: error }, "[discovery] listSummaries failed"); return { watching: [], completed: [], pending: [] }; }),
        getBecauseYouWatched(userId, viewerIsAdmin).catch((error) => { request.log.error({ err: error }, "[discovery] getBecauseYouWatched failed"); return { sourceGenres: [], sourceStudios: [], items: [] as { anime: unknown; score: number; reasons: string[] }[] }; }),
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
    const query = request.query as AnimeQuery;
    const page = Math.max(1, parseIntParam(query.page, 1) ?? 1);
    const limit = Math.min(48, Math.max(1, parseIntParam(query.limit, 24) ?? 24));
    const sort = isOneOf(first(query.sort), animeSorts) ? (first(query.sort) as AnimeSort) : "relevance";
    const defaultOrder = sort === "rank" ? "asc" : "desc";
    const order = isOneOf(first(query.order), sortOrders) ? (first(query.order) as SortOrder) : defaultOrder;
    const status = isOneOf(first(query.status), animeStatuses) ? first(query.status) : undefined;
    const season = isOneOf(first(query.season), animeSeasons) ? first(query.season) : undefined;
    const view = isOneOf(first(query.view), ["catalog", "upcoming"] as const) ? (first(query.view) as "catalog" | "upcoming") : undefined;
    const format = first(query.format)?.trim();
    const studio = first(query.studio)?.trim();
    const viewerIsAdmin = await isAdminUser(request);

    return listAnimes({
      page,
      limit,
      search: first(query.search)?.trim() || undefined,
      genres: parseGenres(query.genre),
      status,
      year: parseIntParam(query.year),
      season,
      sort,
      order,
      viewerIsAdmin,
      view,
      format,
      studio,
    });
  });

  app.get("/animes/genres", async () => ({ genres: await listAnimeGenres() }));

  app.get("/animes/stats", async (request) => getAnimeStats(await isAdminUser(request)));

  app.get("/animes/studios", async () => {
    const result = await db.execute<{ studio: string; count: number }>(sql`
      SELECT ${animes.studio} AS studio, count(*)::int AS count
      FROM ${animes}
      WHERE ${animes.studio} IS NOT NULL AND ${animes.hidden} = false
      GROUP BY ${animes.studio}
      ORDER BY count DESC
      LIMIT 20
    `);
    return { studios: result.rows };
  });

  app.get("/animes/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const viewerIsAdmin = await isAdminUser(request);
    const anime = await getAnimeById(Number.parseInt(id, 10), viewerIsAdmin);

    if (!anime) {
      return reply.status(404).send({ message: "Anime no encontrado" });
    }

    return anime;
  });

  app.patch("/animes/:id/visibility", { preHandler: requireAdmin }, async (request, reply) => {
    const animeId = Number.parseInt((request.params as { id: string }).id, 10);
    if (!Number.isFinite(animeId)) return reply.status(400).send({ message: "Anime inválido" });

    const body = animeVisibilityBodySchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ message: "Cuerpo inválido" });

    const anime = await db.query.animes.findFirst({ where: eq(animes.id, animeId) });
    if (!anime) return reply.status(404).send({ message: "Anime no encontrado" });

    await db
      .update(animes)
      .set({
        hidden: body.data.hidden,
        hiddenReason: body.data.hidden ? body.data.reason ?? "manual" : null,
      })
      .where(eq(animes.id, animeId));

    return { message: "Visibilidad actualizada" };
  });

  app.get("/animes/:id/episodes", async (request, reply) => {
    const animeId = Number.parseInt((request.params as { id: string }).id, 10);
    if (!Number.isFinite(animeId)) return reply.status(400).send({ message: "Anime inválido" });

    const anime = await db.query.animes.findFirst({ where: eq(animes.id, animeId), columns: { malId: true } });
    if (!anime?.malId) return reply.status(404).send({ message: "Anime no encontrado o sin MAL ID" });

    const pageQuery = (request.query as { page?: string }).page;
    const page = pageQuery ? Number.parseInt(pageQuery, 10) : null;

    try {
      if (page !== null && Number.isFinite(page) && page > 0) {
        const result = await getEpisodesPaged(animeId, anime.malId, page, db);
        reply.header("x-cache-status", result.status);
        return { pagination: result.pagination, data: result.data };
      }

      const result = await getEpisodesFlat(animeId, anime.malId, db);
      reply.header("x-cache-status", result.status);
      return result.episodes;
    } catch (error: unknown) {
      if (error instanceof JikanRateLimitError) {
        reply.header("Retry-After", String(error.retryAfterSeconds));
        return reply.status(503).send({ message: "Jikan rate limit alcanzado" });
      }
      request.log.error({ err: error }, "[episodes] Error al obtener episodios");
      return reply.status(500).send({ message: "Error al obtener episodios" });
    }
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
      .where(and(eq(userAnimeProgress.userId, userId), eq(userAnimeProgress.watched, false)))
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
