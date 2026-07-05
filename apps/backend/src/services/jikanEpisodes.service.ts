import { and, eq } from "drizzle-orm";

import { animeEpisodesCache, type Database } from "@template/database";
import type { AnimeEpisode } from "@template/shared";

export interface JikanPagination {
  last_visible_page: number;
  has_next_page: boolean;
  current_page?: number;
}

export interface JikanEpisode {
  mal_id: number;
  url?: string;
  title: string;
  title_japanese?: string | null;
  title_romanji?: string | null;
  aired?: string | null;
  score?: number | null;
  filler?: boolean;
  recap?: boolean;
  forum_url?: string;
}

export interface JikanEpisodesResponse {
  pagination: JikanPagination;
  data: JikanEpisode[];
}

export type CacheStatus = "HIT" | "MISS" | "PARTIAL";

export type PagedEpisodesResult = {
  pagination: { lastVisiblePage: number; hasNextPage: boolean; currentPage: number };
  data: AnimeEpisode[];
  status: CacheStatus;
};

const JIKAN_REQUEST_GAP_MS = 350;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const JIKAN_EPISODES_URL = "https://api.jikan.moe/v4/anime";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const inFlight = new Map<string, Promise<unknown>>();

export class JikanRateLimitError extends Error {
  constructor(public retryAfterSeconds: number) {
    super("Jikan rate limit alcanzado");
    this.name = "JikanRateLimitError";
  }
}

class JikanFetchError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "JikanFetchError";
  }
}

export const parseJikanPagination = (raw: JikanEpisodesResponse): { lastVisiblePage: number; hasNextPage: boolean; currentPage: number } => {
  const lastVisiblePage = raw.pagination?.last_visible_page ? Math.max(1, raw.pagination.last_visible_page) : 1;
  const hasNextPage = raw.pagination?.has_next_page ?? false;
  const currentPage = raw.pagination?.current_page ?? 1;
  return { lastVisiblePage, hasNextPage, currentPage };
};

export const mapJikanEpisodeToAnimeEpisode = (jikanEp: JikanEpisode, animeId: number, cachedAt: Date): AnimeEpisode => {
  return {
    animeId,
    season: 1,
    episode: jikanEp.mal_id,
    title: jikanEp.title,
    thumbnailUrl: null,
    airedAt: jikanEp.aired ? new Date(jikanEp.aired).toISOString() : null,
    createdAt: cachedAt.toISOString(),
    filler: jikanEp.filler ?? false,
    recap: jikanEp.recap ?? false,
    score: jikanEp.score ?? null,
    titleJapanese: jikanEp.title_japanese ?? null,
  };
};

export const parseJikanEpisodesResponse = (raw: JikanEpisodesResponse, animeId: number, cachedAt: Date): AnimeEpisode[] => {
  if (!raw.data || raw.data.length === 0) return [];
  return raw.data.map((episode) => mapJikanEpisodeToAnimeEpisode(episode, animeId, cachedAt));
};

export const isCacheValid = (cachedAt: Date, ttlMs: number, now = Date.now()): boolean => {
  return now - cachedAt.getTime() < ttlMs;
};

export const fetchJikanPage = async (malId: number, page: number): Promise<JikanEpisodesResponse> => {
  const url = `${JIKAN_EPISODES_URL}/${malId}/episodes?page=${page}`;
  console.log(`Obteniendo episodios de Jikan para anime ${malId} página ${page}`);

  const doFetch = async (): Promise<JikanEpisodesResponse> => {
    const response = await fetch(url);

    if (response.status === 429) {
      const retryAfterHeader = response.headers.get("Retry-After");
      const retryAfterSeconds = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : 1;
      console.log(`Jikan 429 para anime ${malId}, esperando ${retryAfterSeconds}s`);
      await sleep(retryAfterSeconds * 1000);
      const retryResponse = await fetch(url);
      if (retryResponse.status === 429) {
        throw new JikanRateLimitError(retryAfterSeconds);
      }
      if (!retryResponse.ok) {
        throw new JikanFetchError(retryResponse.status, `Jikan respondió ${retryResponse.status}`);
      }
      return (await retryResponse.json()) as JikanEpisodesResponse;
    }

    if (!response.ok) {
      throw new JikanFetchError(response.status, `Jikan respondió ${response.status}`);
    }

    return (await response.json()) as JikanEpisodesResponse;
  };

  try {
    const data = await doFetch();
    if (data.data.length === 0) {
      console.log(`Jikan no devolvió episodios para anime ${malId} página ${page}`);
    }
    return data;
  } finally {
    await sleep(JIKAN_REQUEST_GAP_MS);
  }
};

export const getCachePage = async (animeId: number, page: number, db: Database): Promise<JikanEpisodesResponse | null> => {
  const row = await db.query.animeEpisodesCache.findFirst({
    where: and(eq(animeEpisodesCache.animeId, animeId), eq(animeEpisodesCache.page, page)),
  });

  if (!row) return null;
  if (!isCacheValid(row.cachedAt, CACHE_TTL_MS)) return null;

  console.log(`Caché HIT para anime ${animeId} página ${page}`);
  return row.data as JikanEpisodesResponse;
};

export const upsertCachePage = async (
  animeId: number,
  page: number,
  rawData: JikanEpisodesResponse,
  db: Database,
): Promise<void> => {
  const cachedAt = new Date();
  await db
    .insert(animeEpisodesCache)
    .values({ animeId, page, data: rawData, cachedAt })
    .onConflictDoUpdate({
      target: [animeEpisodesCache.animeId, animeEpisodesCache.page],
      set: { data: rawData, cachedAt },
    });
};

export const getEpisodesFlat = async (
  animeId: number,
  malId: number,
  db: Database,
): Promise<{ episodes: AnimeEpisode[]; status: CacheStatus }> => {
  const key = `${animeId}:all`;
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<{ episodes: AnimeEpisode[]; status: CacheStatus }>;

  const promise = (async (): Promise<{ episodes: AnimeEpisode[]; status: CacheStatus }> => {
    const cachedRows = await db.query.animeEpisodesCache.findMany({
      where: eq(animeEpisodesCache.animeId, animeId),
    });

    const cachedPages = new Map<number, JikanEpisodesResponse>();
    for (const row of cachedRows) {
      if (isCacheValid(row.cachedAt, CACHE_TTL_MS)) {
        cachedPages.set(row.page, row.data as JikanEpisodesResponse);
      }
    }

    const firstPage = cachedPages.get(1) ?? (await fetchJikanPage(malId, 1));
    if (!cachedPages.has(1)) {
      await upsertCachePage(animeId, 1, firstPage, db);
      cachedPages.set(1, firstPage);
    }

    const { lastVisiblePage } = parseJikanPagination(firstPage);
    const episodes: AnimeEpisode[] = [];
    let hits = 0;
    let misses = 0;

    for (let page = 1; page <= lastVisiblePage; page++) {
      const cached = cachedPages.get(page);
      let raw: JikanEpisodesResponse;
      let cachedAt: Date;

      if (cached) {
        raw = cached;
        cachedAt = cachedRows.find((row) => row.page === page)?.cachedAt ?? new Date();
        hits++;
      } else {
        console.log(`Caché MISS, refrescando anime ${animeId} página ${page}`);
        raw = await fetchJikanPage(malId, page);
        cachedAt = new Date();
        await upsertCachePage(animeId, page, raw, db);
        misses++;
      }

      episodes.push(...parseJikanEpisodesResponse(raw, animeId, cachedAt));
    }

    let status: CacheStatus;
    if (hits > 0 && misses > 0) status = "PARTIAL";
    else if (hits > 0) status = "HIT";
    else status = "MISS";

    return { episodes, status };
  })();

  inFlight.set(key, promise);

  try {
    return await promise;
  } finally {
    inFlight.delete(key);
  }
};

export const getEpisodesPaged = async (
  animeId: number,
  malId: number,
  page: number,
  db: Database,
): Promise<PagedEpisodesResult> => {
  const key = `${animeId}:${page}`;
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<PagedEpisodesResult>;

  const promise = (async (): Promise<PagedEpisodesResult> => {
    const cached = await getCachePage(animeId, page, db);
    if (cached) {
      return {
        pagination: parseJikanPagination(cached),
        data: parseJikanEpisodesResponse(cached, animeId, new Date()),
        status: "HIT",
      };
    }

    console.log(`Caché MISS, refrescando anime ${animeId} página ${page}`);
    const raw = await fetchJikanPage(malId, page);
    await upsertCachePage(animeId, page, raw, db);

    return {
      pagination: parseJikanPagination(raw),
      data: parseJikanEpisodesResponse(raw, animeId, new Date()),
      status: "MISS",
    };
  })();

  inFlight.set(key, promise);

  try {
    return await promise;
  } finally {
    inFlight.delete(key);
  }
};
