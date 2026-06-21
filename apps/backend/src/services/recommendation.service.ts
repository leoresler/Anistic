import { and, desc, eq, sql } from "drizzle-orm";

import { animeGenres, animeUserEvents, animes, createDb, userAnimeLists, userAnimeProgress } from "@template/database";
import type { Anime, RecommendationItem } from "@template/shared";

import { env } from "../env";

const { db } = createDb(env.DATABASE_URL);

type AnimeCard = Anime;

export type { RecommendationItem };

const SCORE_WEIGHTS = {
  genreMatch: 18,
  studioMatch: 10,
  malScore: 20,
  popularity: 8,
  rank: 6,
  airing: 5,
  newish: 3,
  recentCommunity: 4,
  alreadyTouchedPenalty: 18,
} as const;

const weightCaseSql = sql`case ${animeUserEvents.eventType}
  when 'episode_completed' then 10
  when 'list_added' then 6
  when 'stream_used' then 5
  when 'episode_started' then 4
  when 'anime_viewed' then 1
  when 'card_clicked' then 1
  else 1
end`;

const animeCardSql = sql`
  json_build_object(
    'id', ${animes.id},
    'title', ${animes.title},
    'titleEnglish', ${animes.titleEnglish},
    'titleJapanese', ${animes.titleJapanese},
    'synopsis', ${animes.synopsis},
    'imageUrl', ${animes.imageUrl},
    'trailerUrl', ${animes.trailerUrl},
    'episodes', ${animes.episodes},
    'status', ${animes.status},
    'score', ${animes.score},
    'scoredBy', ${animes.scoredBy},
    'rank', ${animes.rank},
    'popularity', ${animes.popularity},
    'year', ${animes.year},
    'season', ${animes.season},
    'studio', ${animes.studio},
    'rating', ${animes.rating},
    'duration', ${animes.duration},
    'source', ${animes.source},
    'malId', ${animes.malId},
    'syncedAt', ${animes.syncedAt},
    'createdAt', ${animes.createdAt},
    'genres', coalesce((select array_agg(${animeGenres.genre} order by ${animeGenres.genre}) from ${animeGenres} where ${animeGenres.animeId} = ${animes.id}), '{}')
  )
`;

const normalizeRank = (value: number | null, max = 1_000) => (value && value > 0 ? Math.max(0, (max - Math.min(value, max)) / max) : 0);
const numericScore = (value: string | null) => (value ? Number.parseFloat(value) || 0 : 0);
const uniqueReasons = (reasons: string[]) => [...new Set(reasons)].slice(0, 3);

const getUserProfile = async (userId: string | null) => {
  if (!userId) return { genres: [] as string[], studios: [] as string[], touchedAnimeIds: new Set<number>(), excludedAnimeIds: new Set<number>() };

  const [genreRows, studioRows, progressRows, listRows] = await Promise.all([
    db.execute<{ genre: string; weight: number }>(sql`
      with signals as (
        select anime_id, ${weightCaseSql}::float as weight, created_at from ${animeUserEvents} where user_id = ${userId} and anime_id is not null
        union all
        select anime_id, case when watched then 8 else 3 end::float as weight, updated_at as created_at from ${userAnimeProgress} where user_id = ${userId}
        union all
        select anime_id, case status when 'completed' then 8 when 'watching' then 5 else 2 end::float as weight, updated_at as created_at from ${userAnimeLists} where user_id = ${userId}
      )
      select ${animeGenres.genre} as genre, sum(signals.weight * case when signals.created_at > now() - interval '30 days' then 1.5 else 1 end)::float as weight
      from signals
      inner join ${animeGenres} on ${animeGenres.animeId} = signals.anime_id
      group by ${animeGenres.genre}
      order by weight desc
      limit 8
    `),
    db.execute<{ studio: string; weight: number }>(sql`
      with signals as (
        select anime_id, ${weightCaseSql}::float as weight, created_at from ${animeUserEvents} where user_id = ${userId} and anime_id is not null
        union all
        select anime_id, case when watched then 8 else 3 end::float as weight, updated_at as created_at from ${userAnimeProgress} where user_id = ${userId}
        union all
        select anime_id, case status when 'completed' then 8 when 'watching' then 5 else 2 end::float as weight, updated_at as created_at from ${userAnimeLists} where user_id = ${userId}
      )
      select ${animes.studio} as studio, sum(signals.weight * case when signals.created_at > now() - interval '30 days' then 1.5 else 1 end)::float as weight
      from signals
      inner join ${animes} on ${animes.id} = signals.anime_id
      where ${animes.studio} is not null
      group by ${animes.studio}
      order by weight desc
      limit 5
    `),
    db.select({ animeId: userAnimeProgress.animeId, watched: userAnimeProgress.watched }).from(userAnimeProgress).where(eq(userAnimeProgress.userId, userId)),
    db.select({ animeId: userAnimeLists.animeId, status: userAnimeLists.status }).from(userAnimeLists).where(eq(userAnimeLists.userId, userId)),
  ]);

  const touchedAnimeIds = new Set<number>();
  const excludedAnimeIds = new Set<number>();
  for (const row of progressRows) {
    touchedAnimeIds.add(row.animeId);
    if (row.watched) excludedAnimeIds.add(row.animeId);
  }
  for (const row of listRows) {
    touchedAnimeIds.add(row.animeId);
    if (row.status === "completed") excludedAnimeIds.add(row.animeId);
  }

  return {
    genres: genreRows.rows.map((row) => row.genre),
    studios: studioRows.rows.map((row) => row.studio),
    touchedAnimeIds,
    excludedAnimeIds,
  };
};

const getRecentActivity = async () => {
  const rows = await db.execute<{ animeId: number; activity: number }>(sql`
    select ${animeUserEvents.animeId} as "animeId", sum(${weightCaseSql})::float as activity
    from ${animeUserEvents}
    where ${animeUserEvents.animeId} is not null and ${animeUserEvents.createdAt} > now() - interval '7 days'
    group by ${animeUserEvents.animeId}
  `);
  return new Map(rows.rows.map((row) => [row.animeId, row.activity]));
};

const getCandidates = async (favoriteGenres: string[], favoriteStudios: string[]) => {
  const genreCondition = favoriteGenres.length
    ? sql`exists (select 1 from ${animeGenres} ag where ag.anime_id = ${animes.id} and ag.genre in (${sql.join(favoriteGenres.map((g) => sql`${g}`), sql`, `)}))`
    : sql`true`;

  const studioCondition = favoriteStudios.length
    ? sql`${animes.studio} in (${sql.join(favoriteStudios.map((s) => sql`${s}`), sql`, `)})`
    : sql`false`;

  const rows = await db.execute<{ anime: AnimeCard }>(sql`
    select ${animeCardSql} as anime
    from ${animes}
    where ${genreCondition}
       or ${studioCondition}
    order by ${animes.score} desc nulls last, ${animes.popularity} asc nulls last, ${animes.rank} asc nulls last
    limit 220
  `);
  return rows.rows.map((row) => row.anime);
};

const scoreCandidate = (anime: AnimeCard, profile: Awaited<ReturnType<typeof getUserProfile>>, recentActivity: Map<number, number>): RecommendationItem => {
  const matchedGenres = anime.genres.filter((genre) => profile.genres.includes(genre));
  const matchedStudio = anime.studio && profile.studios.includes(anime.studio) ? anime.studio : null;
  const community = recentActivity.get(anime.id) ?? 0;
  const year = anime.year ?? 0;
  const currentYear = new Date().getFullYear();

  let score = 0;
  score += matchedGenres.length * SCORE_WEIGHTS.genreMatch;
  score += matchedStudio ? SCORE_WEIGHTS.studioMatch : 0;
  score += (numericScore(anime.score) / 10) * SCORE_WEIGHTS.malScore;
  score += normalizeRank(anime.popularity) * SCORE_WEIGHTS.popularity;
  score += normalizeRank(anime.rank) * SCORE_WEIGHTS.rank;
  score += anime.status === "Airing" ? SCORE_WEIGHTS.airing : 0;
  score += year >= currentYear - 1 ? SCORE_WEIGHTS.newish : 0;
  score += Math.min(1, community / 30) * SCORE_WEIGHTS.recentCommunity;
  score -= profile.touchedAnimeIds.has(anime.id) ? SCORE_WEIGHTS.alreadyTouchedPenalty : 0;

  const reasons = uniqueReasons([
    ...matchedGenres.slice(0, 2).map((genre) => `Te gusta ${genre}`),
    ...(matchedStudio ? [`Te gusta ${matchedStudio}`] : []),
    ...(numericScore(anime.score) >= 8 ? ["Buen puntaje"] : []),
    ...(community > 0 ? ["Popular esta semana"] : []),
    ...(anime.status === "Airing" ? ["En emisión"] : []),
  ]);

  return { anime, score: Math.round(score * 10) / 10, reasons: reasons.length ? reasons : ["Buen equilibrio de ranking y popularidad"] };
};

export const getBecauseYouWatched = async (userId: string | null, limit = 12) => {
  const [profile, recentActivity] = await Promise.all([getUserProfile(userId), getRecentActivity()]);
  const candidates = await getCandidates(profile.genres, profile.studios);
  const items = candidates
    .filter((anime) => !profile.excludedAnimeIds.has(anime.id))
    .map((anime) => scoreCandidate(anime, profile, recentActivity))
    .sort((a, b) => b.score - a.score || (a.anime.popularity ?? 999_999) - (b.anime.popularity ?? 999_999))
    .slice(0, limit);

  return { sourceGenres: profile.genres.slice(0, 6), sourceStudios: profile.studios.slice(0, 3), items };
};

export const getTopWeek = async (limit = 12) => {
  const rows = await db.execute<{ anime: AnimeCard; activity: number }>(sql`
    select ${animeCardSql} as anime, sum(${weightCaseSql})::float as activity
    from ${animeUserEvents}
    inner join ${animes} on ${animes.id} = ${animeUserEvents.animeId}
    where ${animeUserEvents.animeId} is not null and ${animeUserEvents.createdAt} > now() - interval '7 days'
    group by ${animes.id}
    order by activity desc, ${animes.score} desc nulls last, ${animes.popularity} asc nulls last
    limit ${limit}
  `);

  if (rows.rows.length > 0) {
    return {
      fallback: false,
      items: rows.rows.map((row) => ({ anime: row.anime, score: Math.round(row.activity * 10) / 10, reasons: ["Actividad de los últimos 7 días"] })),
    };
  }

  const fallbackRows = await db.execute<{ anime: AnimeCard }>(sql`
    select ${animeCardSql} as anime
    from ${animes}
    order by ${animes.score} desc nulls last, ${animes.popularity} asc nulls last
    limit ${limit}
  `);

  return {
    fallback: true,
    items: fallbackRows.rows.map((row) => ({ anime: row.anime, score: numericScore(row.anime.score), reasons: ["Fallback por ranking y popularidad"] })),
  };
};

export const getPopularCommunity = async (limit = 12) => {
  const rows = await db.execute<{ anime: AnimeCard; viewers: number; activity: number }>(sql`
    select ${animeCardSql} as anime, count(distinct ${animeUserEvents.userId})::int as viewers, sum(${weightCaseSql})::float as activity
    from ${animeUserEvents}
    inner join ${animes} on ${animes.id} = ${animeUserEvents.animeId}
    where ${animeUserEvents.animeId} is not null
    group by ${animes.id}
    order by sum(case when ${animeUserEvents.createdAt} > now() - interval '30 days' then ${weightCaseSql} else 0 end) desc, activity desc
    limit ${limit}
  `);

  if (rows.rows.length > 0) return rows.rows.map((row) => ({ anime: row.anime, viewers: row.viewers, score: Math.round(row.activity * 10) / 10, reasons: ["Actividad reciente de la comunidad"] }));

  const fallbackRows = await db.select({ progress: userAnimeProgress, anime: animes }).from(userAnimeProgress).innerJoin(animes, eq(animes.id, userAnimeProgress.animeId)).orderBy(desc(userAnimeProgress.updatedAt)).limit(limit);
  return fallbackRows.map((row) => ({ anime: { ...row.anime, genres: [] } as unknown as AnimeCard, viewers: 1, score: 0, reasons: ["Fallback por progreso guardado"] }));
};

export const getContinueWatching = async (userId: string | null) => {
  if (!userId) return [];
  return db
    .select({
      progress: userAnimeProgress,
      anime: { id: animes.id, title: animes.title, titleEnglish: animes.titleEnglish, imageUrl: animes.imageUrl, episodes: animes.episodes, score: animes.score, malId: animes.malId, year: animes.year },
    })
    .from(userAnimeProgress)
    .innerJoin(animes, eq(animes.id, userAnimeProgress.animeId))
    .where(and(eq(userAnimeProgress.userId, userId), eq(userAnimeProgress.watched, false)))
    .orderBy(desc(userAnimeProgress.updatedAt))
    .limit(8);
};
