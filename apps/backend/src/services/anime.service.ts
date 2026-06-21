import { and, asc, count, desc, eq, sql } from "drizzle-orm";

import { animeGenres, animes, createDb } from "@template/database";
import type { AnimeSort, SortOrder } from "@template/shared";

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
};

const orderColumn = {
  score: animes.score,
  popularity: animes.popularity,
  year: animes.year,
  rank: animes.rank,
} satisfies Record<AnimeSort, typeof animes.score | typeof animes.popularity | typeof animes.year | typeof animes.rank>;

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
  syncedAt: animes.syncedAt,
  createdAt: animes.createdAt,
};

const genreArray = sql<string[]>`coalesce(array_remove(array_agg(${animeGenres.genre} order by ${animeGenres.genre}), null), '{}')`;

const buildWhere = (input: ListAnimesInput) => {
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

  if (input.status) filters.push(eq(animes.status, input.status));
  if (input.year) filters.push(eq(animes.year, input.year));
  if (input.season) filters.push(eq(animes.season, input.season));

  return filters.length > 0 ? and(...filters) : undefined;
};

export const listAnimes = async (input: ListAnimesInput) => {
  const where = buildWhere(input);
  const offset = (input.page - 1) * input.limit;
  const direction = input.order === "asc" ? asc(orderColumn[input.sort]) : desc(orderColumn[input.sort]);

  const [totalRow] = await db.select({ total: count() }).from(animes).where(where);

  const data = await db
    .select({ ...animePayload, genres: genreArray })
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

export const getAnimeById = async (id: number) => {
  const [anime] = await db
    .select({ ...animePayload, genres: genreArray })
    .from(animes)
    .leftJoin(animeGenres, eq(animeGenres.animeId, animes.id))
    .where(eq(animes.id, id))
    .groupBy(animes.id)
    .limit(1);

  return anime;
};

export const listAnimeGenres = async () => {
  const rows = await db.selectDistinct({ genre: animeGenres.genre }).from(animeGenres).orderBy(animeGenres.genre);
  return rows.map((row) => row.genre);
};

export const getAnimeStats = async () => {
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
      (select coalesce(array_agg(distinct year order by year desc), '{}') from animes where year is not null) as years
    from animes
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
