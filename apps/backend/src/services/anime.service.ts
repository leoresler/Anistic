import { and, asc, count, desc, eq, sql } from "drizzle-orm";

import { animeGenres, animes, createDb } from "@template/database";
import type { AnimeFormat, AnimeSort, SortOrder } from "@template/shared";

import { env } from "../env";

const { db } = createDb(env.DATABASE_URL);

export type { AnimeSort, SortOrder };

export type ListAnimesInput = {
  page: number;
  limit: number;
  search?: string;
  genres: string[];
  status?: string;
  format?: AnimeFormat;
  year?: number;
  season?: string;
  sort: AnimeSort;
  order: SortOrder;
};

export const orderColumn = {
  relevance: animes.relevanceScore,
  score: animes.score,
  popularity: animes.popularity,
  year: animes.year,
  rank: animes.rank,
} satisfies Record<AnimeSort, typeof animes.relevanceScore | typeof animes.score | typeof animes.popularity | typeof animes.year | typeof animes.rank>;

export const animePayload = {
  id: animes.id,
  title: animes.title,
  titleEnglish: animes.titleEnglish,
  titleJapanese: animes.titleJapanese,
  synopsis: animes.synopsis,
  imageUrl: animes.imageUrl,
  bannerUrl: animes.bannerUrl,
  trailerUrl: animes.trailerUrl,
  episodes: animes.episodes,
  status: animes.status,
  score: animes.score,
  scoredBy: animes.scoredBy,
  rank: animes.rank,
  popularity: animes.popularity,
  anilistId: animes.anilistId,
  format: animes.format,
  countryOfOrigin: animes.countryOfOrigin,
  startDate: animes.startDate,
  averageScore: animes.averageScore,
  anilistPopularity: animes.anilistPopularity,
  trending: animes.trending,
  relevanceScore: animes.relevanceScore,
  year: animes.year,
  season: animes.season,
  studio: animes.studio,
  rating: animes.rating,
  duration: animes.duration,
  source: animes.source,
  malId: animes.malId,
  kitsuId: animes.kitsuId,
  hidden: animes.hidden,
  syncedAt: animes.syncedAt,
  createdAt: animes.createdAt,
};

const genreArray = sql<string[]>`coalesce(array_remove(array_agg(${animeGenres.genre} order by ${animeGenres.genre}), null), '{}')`;

export const publicAnimeWhere = eq(animes.hidden, false);

export const buildAnimeByIdWhere = (id: number) => sql`${animes.id} = ${id} and ${publicAnimeWhere}`;

export const buildListAnimeGenresSql = () => sql<{ genre: string }>`
  select distinct ${animeGenres.genre} as genre
  from ${animeGenres}
  inner join ${animes} on ${animes.id} = ${animeGenres.animeId}
  where ${publicAnimeWhere}
  order by ${animeGenres.genre}
`;

export const buildAnimeStatsSql = () => sql<{
  total: number;
  airing: number;
  finished: number;
  top_score: string | null;
  genres: number;
  years: number[] | null;
}>`
  select
    count(*)::int as total,
    count(*) filter (where status = 'Airing')::int as airing,
    count(*) filter (where status = 'Finished Airing')::int as finished,
    max(score) as top_score,
    (select count(distinct ag.genre)::int from anime_genres ag inner join animes a on a.id = ag.anime_id where a.hidden = false) as genres,
    (select coalesce(array_agg(distinct year order by year desc), '{}') from animes where hidden = false and year is not null) as years
  from animes where hidden = false
`;

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

  if (input.status) filters.push(eq(animes.status, input.status));
  if (input.format) filters.push(eq(animes.format, input.format));
  if (input.year) filters.push(eq(animes.year, input.year));
  if (input.season) filters.push(eq(animes.season, input.season));
  filters.push(publicAnimeWhere);

  return and(...filters);
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
    .where(buildAnimeByIdWhere(id))
    .groupBy(animes.id)
    .limit(1);

  return anime;
};

export const listAnimeGenres = async () => {
  const rows = await db.execute(buildListAnimeGenresSql());
  return rows.rows.map((row) => row.genre);
};

export const getAnimeStats = async () => {
  const statsResult = await db.execute(buildAnimeStatsSql());
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
