import { z } from "zod";

export const animeSorts = ["score", "popularity", "year", "rank"] as const;
export const sortOrders = ["asc", "desc"] as const;
export const animeStatuses = ["Airing", "Finished Airing"] as const;
export const animeSeasons = ["winter", "spring", "summer", "fall"] as const;
export const userAnimeListStatuses = ["watching", "completed", "pending"] as const;

export const animeSortSchema = z.enum(animeSorts);
export const sortOrderSchema = z.enum(sortOrders);
export const animeStatusSchema = z.enum(animeStatuses);
export const animeSeasonSchema = z.enum(animeSeasons);
export const userAnimeListStatusSchema = z.enum(userAnimeListStatuses);

export const animeListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(48).default(24),
  search: z.string().trim().min(1).optional(),
  genres: z.array(z.string().trim().min(1)).default([]),
  status: animeStatusSchema.optional(),
  year: z.coerce.number().int().positive().optional(),
  season: animeSeasonSchema.optional(),
  sort: animeSortSchema.default("score"),
  order: sortOrderSchema.optional(),
});

export const animeProgressBodySchema = z.object({
  season: z.coerce.number().int().positive().default(1),
  episode: z.coerce.number().int().positive(),
  progressSeconds: z.coerce.number().int().min(0),
  durationSeconds: z.coerce.number().int().min(0).optional(),
  watched: z.boolean().optional(),
});

export const userAnimeListBodySchema = z.object({
  status: userAnimeListStatusSchema,
});

export type AnimeSort = z.infer<typeof animeSortSchema>;
export type SortOrder = z.infer<typeof sortOrderSchema>;
export type AnimeStatus = z.infer<typeof animeStatusSchema>;
export type AnimeSeason = z.infer<typeof animeSeasonSchema>;
export type UserAnimeListStatus = z.infer<typeof userAnimeListStatusSchema>;
export type AnimeListQuery = z.infer<typeof animeListQuerySchema>;
export type AnimeProgressBody = z.infer<typeof animeProgressBodySchema>;
export type UserAnimeListBody = z.infer<typeof userAnimeListBodySchema>;

export type Anime = {
  id: number;
  title: string;
  titleEnglish: string | null;
  titleJapanese: string | null;
  synopsis: string | null;
  imageUrl: string | null;
  trailerUrl: string | null;
  episodes: number | null;
  status: string | null;
  score: string | null;
  scoredBy: number | null;
  rank: number | null;
  popularity: number | null;
  year: number | null;
  season: string | null;
  studio: string | null;
  rating: string | null;
  duration: string | null;
  source: string | null;
  malId: number;
  kitsuId: string | null;
  syncedAt: string;
  createdAt: string;
  genres: string[];
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type AnimeListResponse = {
  data: Anime[];
  pagination: Pagination;
};

export type AnimeStats = {
  total: number;
  airing: number;
  finished: number;
  topScore: string | null;
  genres: number;
  years: number[];
};

export type AnimeProgress = {
  id: string;
  userId: string;
  animeId: number;
  season: number;
  episode: number;
  durationSeconds: number;
  progressSeconds: number;
  watched: boolean;
  updatedAt: string;
  createdAt: string;
};

export type AnimeProgressResponse = {
  progress: AnimeProgress[];
  continueWatching: AnimeProgress | null;
};

export type AnimeSummary = Pick<Anime, "id" | "title" | "titleEnglish" | "imageUrl" | "episodes" | "score" | "malId" | "year">;

export type ContinueWatchingItem = {
  progress: AnimeProgress;
  anime: AnimeSummary;
};

export type AnimeEpisode = {
  animeId: number;
  season: number;
  episode: number;
  title: string | null;
  thumbnailUrl: string | null;
  airedAt: string | null;
  createdAt: string;
};

export type UserAnimeList = {
  list: {
    id: string;
    userId: string;
    animeId: number;
    status: UserAnimeListStatus;
    createdAt: string;
    updatedAt: string;
  };
  anime: AnimeSummary & Pick<Anime, "status">;
};

export type RecommendationItem = {
  anime: Anime;
  score: number;
  reasons: string[];
};

export type DiscoveryResponse = {
  continueWatching: ContinueWatchingItem[];
  topWeek: { fallback: boolean; items: RecommendationItem[] };
  newEpisodes: Array<{ anime: Anime; latestEpisode: number | null; latestAiredAt: string | null }>;
  becauseYouWatched: { sourceGenres: string[]; sourceStudios: string[]; items: RecommendationItem[]; anime: Anime[] };
  popularAmongUsers: Array<{ anime: Anime; viewers: number; score: number; reasons: string[] }>;
  lists: Record<UserAnimeListStatus, UserAnimeList[]>;
};
