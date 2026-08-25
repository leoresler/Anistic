import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createAniListClient, fetchAniListCatalog } from "./client";
import type { AniListMedia } from "./types";

describe("createAniListClient", () => {
  it("posts AniList GraphQL lane variables and returns page data", async () => {
    const calls: unknown[] = [];
    const client = createAniListClient({
      fetchImpl: async (_url, init) => {
        calls.push(JSON.parse(String(init?.body)));
        return new Response(JSON.stringify({ data: { Page: { pageInfo: { hasNextPage: false }, media: [{ id: 1, idMal: 2 }] } } }), { status: 200 });
      },
      sleep: async () => undefined,
    });

    const page = await client.fetchPage({ countryOfOrigin: "JP", format: "TV" }, 2);

    const body = calls[0] as { query: string; variables: unknown };
    assert.deepEqual(page.media, [{ id: 1, idMal: 2 }]);
    assert.match(body.query, /CatalogLane/);
    assert.deepEqual(body.variables, {
      page: 2,
      perPage: 50,
      countryOfOrigin: "JP",
      format: "TV",
      blockedGenres: ["Hentai", "Erotica", "Boys Love", "Girls Love", "Kids", "Music", "Avant Garde"],
      blockedTags: ["Hentai", "Erotica", "Boys Love", "Girls Love", "Kids", "Music", "Avant Garde", "Sexual Content", "Nudity"],
    });
  });

  it("continues remaining lanes when one page fails after retries", async () => {
    let calls = 0;
    const client = createAniListClient({
      retries: 0,
      fetchImpl: async () => {
        calls += 1;
        if (calls === 1) return new Response("{}", { status: 429 });
        return new Response(JSON.stringify({ data: { Page: { pageInfo: { hasNextPage: false }, media: [{ id: 2, idMal: 3 }] } } }), { status: 200 });
      },
      sleep: async () => undefined,
    });

    const result = await fetchAniListCatalog(client, [
      { countryOfOrigin: "JP", format: "TV" },
      { countryOfOrigin: "KR", format: "ONA" },
    ]);

    assert.equal(result.skippedPages.length, 1);
    assert.deepEqual(result.media, [{ id: 2, idMal: 3 }]);
  });

  it("throttles between successful AniList pages when configured", async () => {
    const sleeps: number[] = [];
    let calls = 0;
    const client = {
      fetchPage: async () => {
        calls += 1;
        return { pageInfo: { hasNextPage: calls < 3 }, media: [{ id: calls, idMal: calls } as AniListMedia] };
      },
    };

    const result = await fetchAniListCatalog(client, [{ countryOfOrigin: "JP", format: "TV" }], {
      delayBetweenPagesMs: 900,
      sleep: async (ms) => {
        sleeps.push(ms);
      },
    });

    assert.equal(result.media.length, 3);
    assert.deepEqual(sleeps, [900, 900]);
  });

  it("stops a lane at the configured max page cap", async () => {
    let calls = 0;
    const client = {
      fetchPage: async () => {
        calls += 1;
        return { pageInfo: { hasNextPage: true }, media: [{ id: calls, idMal: calls } as AniListMedia] };
      },
    };

    const result = await fetchAniListCatalog(client, [{ countryOfOrigin: "JP", format: "TV" }], {
      maxPagesPerLane: 2,
    });

    assert.equal(calls, 2);
    assert.equal(result.media.length, 2);
  });
});
