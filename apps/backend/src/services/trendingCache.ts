export type CachedItem = { anime: unknown; score: number; reasons: string[] };
type TrendingCache = { items: CachedItem[]; fetchedAt: number };

let cache: TrendingCache | null = null;
const TTL_MS = 60 * 60 * 1000;

export const getTrendingCache = (): TrendingCache | null => {
  if (!cache) return null;
  if (Date.now() - cache.fetchedAt > TTL_MS) return null;
  return cache;
};

export const setTrendingCache = (items: CachedItem[]) => {
  cache = { items, fetchedAt: Date.now() };
};

export const clearTrendingCache = () => {
  cache = null;
};
