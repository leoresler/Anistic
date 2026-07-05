import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inArray } from "drizzle-orm";

import { animes, createDb, type NewAnime } from "@template/database";

import { clearTrendingCache, getTrendingCache, setTrendingCache } from "./trendingCache";
import { fetchAniListTrending, getTopWeek } from "./recommendation.service";

const testDb = createDb(process.env.DATABASE_URL).db;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("trendingCache", () => {
  it("returns null when no cache has been set", () => {
    clearTrendingCache();
    assert.equal(getTrendingCache(), null);
  });

  it("returns cached items while the TTL is valid", () => {
    const items = [{ anime: { id: 1 }, score: 0, reasons: ["Trending"] }];
    setTrendingCache(items);

    const cached = getTrendingCache();
    assert.ok(cached);
    assert.deepEqual(cached?.items, items);
  });

  it("returns null after the TTL expires", async () => {
    const items = [{ anime: { id: 1 }, score: 0, reasons: ["Trending"] }];
    setTrendingCache(items);
    // Force expiry by overriding fetchedAt to the past.
    const cached = getTrendingCache();
    if (cached) cached.fetchedAt = Date.now() - 60 * 60 * 1000 - 1;

    assert.equal(getTrendingCache(), null);
  });
});

describe("fetchAniListTrending", () => {
  it("posts the correct GraphQL query to AniList", async () => {
    const originalFetch = global.fetch;
    let capturedRequest: RequestInit | undefined;

    global.fetch = async (_url, init) => {
      capturedRequest = init;
      return new Response(
        JSON.stringify({ data: { Page: { media: [] } } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    try {
      await fetchAniListTrending();
      assert.equal(capturedRequest?.method, "POST");
      const body = JSON.parse((capturedRequest?.body as string) ?? "{}");
      assert.ok(body.query.includes("TRENDING_DESC"));
      assert.ok(body.query.includes("startDate { year month day }"));
      assert.ok(body.query.includes("format"));
    } finally {
      global.fetch = originalFetch;
    }
  });
});

describe("getTopWeek", () => {
  it("uses internal ranking when there are 50+ recent events", async () => {
    const internalItems = [{ anime: { id: 1 }, score: 10, reasons: ["Internal"] }] as unknown as Awaited<
      ReturnType<typeof getTopWeek>
    >["items"];

    const result = await getTopWeek(false, 12, {
      countRecentEvents: async () => 50,
      getInternalItems: async () => internalItems,
      getFallbackItems: async () => [],
      getCache: () => null,
      fetchTrending: async () => [],
      setCache: () => undefined,
    });

    assert.equal(result.source, "internal");
    assert.equal(result.fallback, false);
    assert.deepEqual(result.items, internalItems);
  });

  it("returns cached trending data when internal events are below the threshold", async () => {
    const cachedItems = [{ anime: { id: 2 }, score: 0, reasons: ["Cached"] }] as unknown as Awaited<
      ReturnType<typeof getTopWeek>
    >["items"];

    const result = await getTopWeek(false, 12, {
      countRecentEvents: async () => 10,
      getInternalItems: async () => [],
      getFallbackItems: async () => [],
      getCache: () => ({ items: cachedItems, fetchedAt: Date.now() }),
      fetchTrending: async () => [],
      setCache: () => undefined,
    });

    assert.equal(result.source, "trending");
    assert.equal(result.fallback, false);
    assert.deepEqual(result.items, cachedItems);
  });

  it("fetches AniList trending and caches the result when the cache is stale", async () => {
    const testId = 900_050;
    await testDb.delete(animes).where(inArray(animes.id, [testId]));
    await testDb.insert(animes).values({
      id: testId,
      malId: testId,
      title: "Trending Mapping Test",
      hidden: false,
      anilistId: 123_456,
    } as NewAnime);

    try {
      let cacheSet: unknown[] | null = null;

      const result = await getTopWeek(false, 12, {
        countRecentEvents: async () => 10,
        getInternalItems: async () => [],
        getFallbackItems: async () => [],
        getCache: () => null,
        fetchTrending: async () =>
          [
            {
              id: 123_456,
              title: { romaji: "Trending Mapping Test" },
            },
          ] as unknown as Awaited<ReturnType<typeof fetchAniListTrending>>,
        setCache: (items) => {
          cacheSet = items;
        },
      });

      assert.equal(result.source, "trending");
      assert.equal(result.fallback, false);
      assert.equal(result.items.length, 1);
      assert.equal(result.items[0]?.anime.id, testId);
      assert.deepEqual(result.items[0]?.reasons, ["Trending en AniList"]);
      assert.equal(cacheSet === result.items, true);
    } finally {
      await testDb.delete(animes).where(inArray(animes.id, [testId]));
    }
  });

  it("falls back to score/popularity ranking when AniList fetch fails", async () => {
    const fallbackItems = [{ anime: { id: 4 }, score: 5, reasons: ["Fallback"] }] as unknown as Awaited<
      ReturnType<typeof getTopWeek>
    >["items"];

    const result = await getTopWeek(false, 12, {
      countRecentEvents: async () => 10,
      getInternalItems: async () => [],
      getFallbackItems: async () => fallbackItems,
      getCache: () => null,
      fetchTrending: async () => {
        throw new Error("AniList down");
      },
      setCache: () => undefined,
    });

    assert.equal(result.source, "fallback");
    assert.equal(result.fallback, true);
    assert.deepEqual(result.items, fallbackItems);
  });
});
