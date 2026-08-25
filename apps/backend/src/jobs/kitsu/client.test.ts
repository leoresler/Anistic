import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createKitsuMappingClient, extractKitsuAnimeIdFromMappingResponse } from "./client";

describe("extractKitsuAnimeIdFromMappingResponse", () => {
  it("extracts the Kitsu anime id from an included anime item", () => {
    const kitsuId = extractKitsuAnimeIdFromMappingResponse({
      data: [
        {
          id: "412",
          type: "mappings",
          relationships: { item: { data: { type: "anime", id: "3936" } } },
        },
      ],
      included: [{ id: "3936", type: "anime" }],
    });

    assert.equal(kitsuId, "3936");
  });

  it("extracts the Kitsu anime id from the relationship related URL when relationship data is absent", () => {
    const kitsuId = extractKitsuAnimeIdFromMappingResponse({
      data: [
        {
          id: "412",
          type: "mappings",
          relationships: {
            item: { links: { related: "https://kitsu.io/api/edge/anime/3936" } },
          },
        },
      ],
    });

    assert.equal(kitsuId, "3936");
  });

  it("returns null for empty or malformed mapping responses", () => {
    assert.equal(extractKitsuAnimeIdFromMappingResponse({ data: [] }), null);
    assert.equal(extractKitsuAnimeIdFromMappingResponse({ data: [{ type: "mappings" }] }), null);
    assert.equal(extractKitsuAnimeIdFromMappingResponse(null), null);
  });
});

describe("createKitsuMappingClient", () => {
  it("requests MAL anime mappings with include=item and returns a Kitsu anime id", async () => {
    const urls: string[] = [];
    const client = createKitsuMappingClient({
      fetchImpl: async (url) => {
        urls.push(String(url));
        return new Response(
          JSON.stringify({
            data: [{ type: "mappings", relationships: { item: { data: { type: "anime", id: "3936" } } } }],
          }),
          { status: 200 },
        );
      },
    });

    const kitsuId = await client.findKitsuAnimeIdByMalId(5114);

    assert.equal(kitsuId, "3936");
    assert.match(urls[0] ?? "", /filter%5BexternalSite%5D=myanimelist%2Fanime/);
    assert.match(urls[0] ?? "", /filter%5BexternalId%5D=5114/);
    assert.match(urls[0] ?? "", /include=item/);
  });

  it("throws when Kitsu returns an HTTP error or the request fails so the batch can count failures", async () => {
    const httpErrorClient = createKitsuMappingClient({
      fetchImpl: async () => new Response("rate limited", { status: 429 }),
    });
    const throwingClient = createKitsuMappingClient({
      fetchImpl: async () => {
        throw new Error("timeout");
      },
    });

    await assert.rejects(() => httpErrorClient.findKitsuAnimeIdByMalId(1), /Kitsu HTTP 429/);
    await assert.rejects(() => throwingClient.findKitsuAnimeIdByMalId(1), /timeout/);
  });
});
