import { and, asc, count, desc, eq, sql } from "drizzle-orm";

import { animeGenres, animes, createDb } from "@template/database";
import type { AdminAnimeStats, AnimeSort, SortOrder } from "@template/shared";

import { env } from "../env";

const { db } = createDb(env.DATABASE_URL);

export type { AnimeSort, SortOrder };

export type ListAnimesInput = {
  page: number;
  limit: number;
  search?: string;
  genres: string[];
  status?: string;
  year?: number;
  season?: string;
  sort: AnimeSort;
  order: SortOrder;
  viewerIsAdmin?: boolean;
  visibility?: "all" | "visible" | "hidden";
  hiddenReason?: string;
  view?: "catalog" | "upcoming";
  format?: string;
  studio?: string;
};

export const orderColumn = {
  score: animes.score,
  popularity: animes.popularity,
  year: animes.year,
  rank: animes.rank,
  hidden: animes.hidden,
  relevance: animes.relevanceScore,
} satisfies Record<AnimeSort, typeof animes.score | typeof animes.popularity | typeof animes.year | typeof animes.rank | typeof animes.hidden | typeof animes.relevanceScore>;

export const animePayload = {
  id: animes.id,
  title: animes.title,
  titleEnglish: animes.titleEnglish,
  titleJapanese: animes.titleJapanese,
  synopsis: animes.synopsis,
  imageUrl: animes.imageUrl,
  trailerUrl: animes.trailerUrl,
  episodes: animes.episodes,
  status: animes.status,
  score: animes.score,
  scoredBy: animes.scoredBy,
  rank: animes.rank,
  popularity: animes.popularity,
  year: animes.year,
  season: animes.season,
  studio: animes.studio,
  rating: animes.rating,
  duration: animes.duration,
  source: animes.source,
  malId: animes.malId,
  kitsuId: animes.kitsuId,
  countryOfOrigin: animes.countryOfOrigin,
  isAdult: animes.isAdult,
  format: animes.format,
  relevanceScore: animes.relevanceScore,
  startDate: animes.startDate,
  syncedAt: animes.syncedAt,
  createdAt: animes.createdAt,
};

export const animePayloadAdmin = {
  ...animePayload,
  hidden: animes.hidden,
  hiddenReason: animes.hiddenReason,
};

const genreArray = sql<string[]>`coalesce(array_remove(array_agg(${animeGenres.genre} order by ${animeGenres.genre}), null), '{}')`;

export const buildWhere = (input: ListAnimesInput) => {
  const filters = [];

  if (input.search) {
    filters.push(
      sql`to_tsvector('spanish', coalesce(${animes.title}, '') || ' ' || coalesce(${animes.synopsis}, '')) @@ plainto_tsquery('spanish', ${input.search})`,
    );
  }

  if (input.genres.length > 0) {
    filters.push(
      sql`exists (select 1 from ${animeGenres} ag_filter where ag_filter.anime_id = ${animes.id} and ag_filter.genre = any(${input.genres}::text[]))`,
    );
  }

  if (input.view === "upcoming") {
    filters.push(eq(animes.status, "Not yet aired"));
  } else if (input.view === "catalog" || !input.view) {
    filters.push(sql`(${animes.status} != 'Not yet aired' OR ${animes.status} IS NULL)`);
  }

  if (input.status && !input.view) filters.push(eq(animes.status, input.status));
  if (input.year) filters.push(eq(animes.year, input.year));
  if (input.season) filters.push(eq(animes.season, input.season));

  if (input.format) filters.push(eq(animes.format, input.format));
  if (input.studio) filters.push(eq(animes.studio, input.studio));

  if (input.visibility === "hidden") {
    filters.push(eq(animes.hidden, true));
  } else if (input.visibility === "visible" || !input.visibility) {
    filters.push(eq(animes.hidden, false));
  }

  if (input.hiddenReason) filters.push(eq(animes.hiddenReason, input.hiddenReason));

  return filters.length > 0 ? and(...filters) : undefined;
};

export const listAnimes = async (input: ListAnimesInput) => {
  const where = buildWhere(input);
  const offset = (input.page - 1) * input.limit;
  const direction = input.order === "asc" ? asc(orderColumn[input.sort]) : desc(orderColumn[input.sort]);
  const payload = input.viewerIsAdmin ? animePayloadAdmin : animePayload;

  const [totalRow] = await db.select({ total: count() }).from(animes).where(where);

  const data = await db
    .select({ ...payload, genres: genreArray })
    .from(animes)
    .leftJoin(animeGenres, eq(animeGenres.animeId, animes.id))
    .where(where)
    .groupBy(animes.id)
    .orderBy(direction, animes.title)
    .limit(input.limit)
    .offset(offset);

  const total = Number(totalRow?.total ?? 0);
  const totalPages = Math.ceil(total / input.limit);

  return {
    data,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages,
      hasNextPage: input.page < totalPages,
      hasPrevPage: input.page > 1,
    },
  };
};

export const getAnimeById = async (id: number, viewerIsAdmin = false) => {
  const payload = viewerIsAdmin ? animePayloadAdmin : animePayload;

  const [anime] = await db
    .select({ ...payload, genres: genreArray })
    .from(animes)
    .leftJoin(animeGenres, eq(animeGenres.animeId, animes.id))
    .where(eq(animes.id, id))
    .groupBy(animes.id)
    .limit(1);

  return anime;
};

const EXCLUDED_GENRES = new Set(["Hentai"]);

export const listAnimeGenres = async () => {
  const rows = await db.selectDistinct({ genre: animeGenres.genre }).from(animeGenres).orderBy(animeGenres.genre);
  return rows.map((row) => row.genre).filter((genre) => !EXCLUDED_GENRES.has(genre));
};

export const getAnimeStats = async (viewerIsAdmin = false) => {
  const hiddenFilter = viewerIsAdmin ? sql`` : sql`where hidden = false`;

  const statsResult = await db.execute<{
    total: number;
    airing: number;
    finished: number;
    top_score: string | null;
    genres: number;
    years: number[] | null;
  }>(sql`
    select
      count(*)::int as total,
      count(*) filter (where status = 'Airing')::int as airing,
      count(*) filter (where status = 'Finished Airing')::int as finished,
      max(score) as top_score,
      (select count(distinct genre)::int from anime_genres) as genres,
      (select coalesce(array_agg(distinct year order by year desc), '{}') from animes where year is not null ${viewerIsAdmin ? sql`` : sql`and hidden = false`}) as years
    from animes
    ${hiddenFilter}
  `);
  const stats = statsResult.rows[0];

  return {
    total: stats?.total ?? 0,
    airing: stats?.airing ?? 0,
    finished: stats?.finished ?? 0,
    topScore: stats?.top_score ?? null,
    genres: stats?.genres ?? 0,
    years: stats?.years ?? [],
  };
};

export const getAdminAnimeStats = async (): Promise<AdminAnimeStats> => {
  const result = await db.execute<{ total: number; visible: number; hidden: number }>(sql`
    select
      count(*)::int as total,
      count(*) filter (where hidden = false)::int as visible,
      count(*) filter (where hidden = true)::int as hidden
    from animes
  `);

  const reasonResult = await db.execute<{ reason: string; count: number }>(sql`
    select coalesce(hidden_reason, 'unknown') as reason, count(*)::int as count
    from animes
    where hidden = true
    group by hidden_reason
  `);

  const hiddenByReason: Record<string, number> = {};
  for (const row of reasonResult.rows) {
    hiddenByReason[row.reason] = row.count;
  }

  const stats = result.rows[0];
  return {
    total: stats?.total ?? 0,
    visible: stats?.visible ?? 0,
    hidden: stats?.hidden ?? 0,
    hiddenByReason,
  };
};
