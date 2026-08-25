import { ANILIST_CATALOG_QUERY, buildLaneVariables, catalogLanes, type AniListLane } from "./query";
import type { AniListMedia } from "./types";

type AniListPage = { pageInfo: { hasNextPage: boolean }; media: AniListMedia[] };
type AniListResponse = { data?: { Page?: AniListPage }; errors?: Array<{ message: string }> };

export type AniListClientOptions = {
  endpoint?: string;
  fetchImpl?: typeof fetch;
  retries?: number;
  delayMs?: number;
  sleep?: (ms: number) => Promise<void>;
};

export type FetchAniListCatalogOptions = {
  delayBetweenPagesMs?: number;
  maxPagesPerLane?: number;
  sleep?: (ms: number) => Promise<void>;
};

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const createAniListClient = ({ endpoint = "https://graphql.anilist.co", fetchImpl = fetch, retries = 2, delayMs = 700, sleep = defaultSleep }: AniListClientOptions = {}) => {
  const fetchPage = async (lane: AniListLane, page: number): Promise<AniListPage> => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const response = await fetchImpl(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({ query: ANILIST_CATALOG_QUERY, variables: buildLaneVariables(lane, page) }),
        });
        if (!response.ok) throw new Error(`AniList HTTP ${response.status}`);
        const body = (await response.json()) as AniListResponse;
        if (body.errors?.length) throw new Error(body.errors.map((error) => error.message).join("; "));
        return body.data?.Page ?? { pageInfo: { hasNextPage: false }, media: [] };
      } catch (error) {
        lastError = error;
        if (attempt < retries) await sleep(delayMs * (attempt + 1));
      }
    }
    throw lastError instanceof Error ? lastError : new Error("AniList request failed");
  };

  return { fetchPage };
};

export const fetchAniListCatalog = async (client = createAniListClient(), lanes = catalogLanes, { delayBetweenPagesMs = 0, maxPagesPerLane = Number.POSITIVE_INFINITY, sleep = defaultSleep }: FetchAniListCatalogOptions = {}) => {
  const media: AniListMedia[] = [];
  const skippedPages: Array<{ lane: AniListLane; page: number; error: string }> = [];

  for (const lane of lanes) {
    let page = 1;
    let hasNextPage = true;
    while (hasNextPage && page <= maxPagesPerLane) {
      try {
        const result = await client.fetchPage(lane, page);
        media.push(...result.media);
        hasNextPage = result.pageInfo.hasNextPage;
        if (hasNextPage && delayBetweenPagesMs > 0) await sleep(delayBetweenPagesMs);
      } catch (error) {
        skippedPages.push({ lane, page, error: error instanceof Error ? error.message : "Unknown AniList error" });
        hasNextPage = false;
      }
      page += 1;
    }
  }

  return { media, skippedPages };
};
