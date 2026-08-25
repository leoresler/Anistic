export type AniListMedia = {
  id: number;
  idMal: number | null;
  isAdult?: boolean | null;
  title: { romaji: string | null; english: string | null; native: string | null };
  description: string | null;
  coverImage: { extraLarge: string | null; large: string | null } | null;
  bannerImage: string | null;
  episodes: number | null;
  status: string | null;
  averageScore: number | null;
  meanScore: number | null;
  popularity: number | null;
  favourites: number | null;
  trending?: number | null;
  season: string | null;
  seasonYear: number | null;
  format: string | null;
  countryOfOrigin: string | null;
  source: string | null;
  genres: string[];
  studios: { nodes: Array<{ name: string }> } | null;
  externalLinks: Array<{ site: string; url: string }>;
  startDate: { year: number | null; month: number | null; day: number | null } | null;
};

export type DiscardReason = "missing_idMal" | "adult" | "blocked_format" | "blocked_genre" | "not_released_low_popularity" | "low_quality_threshold";

export type DiscardCounts = Record<DiscardReason, number>;

export const createDiscardCounts = (): DiscardCounts => ({
  missing_idMal: 0,
  adult: 0,
  blocked_format: 0,
  blocked_genre: 0,
  not_released_low_popularity: 0,
  low_quality_threshold: 0,
});
