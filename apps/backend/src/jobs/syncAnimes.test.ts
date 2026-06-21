import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SQL } from "drizzle-orm";

import type { NewAnime } from "@template/database";

import { buildAnimeUpsertSet } from "./syncAnimes.utils";

const baseRecord: NewAnime = {
  id: 1,
  malId: 1,
  title: "Test Anime",
  titleEnglish: null,
  titleJapanese: null,
  synopsis: null,
  imageUrl: null,
  trailerUrl: null,
  episodes: null,
  status: null,
  score: null,
  scoredBy: null,
  rank: null,
  popularity: null,
  year: null,
  season: null,
  studio: null,
  rating: null,
  duration: null,
  source: null,
  kitsuId: null,
  imdbId: null,
  syncedAt: new Date("2026-01-01T00:00:00Z"),
};

describe("buildAnimeUpsertSet", () => {
  it("preserves an existing DB kitsuId when the incoming record has null", () => {
    const set = buildAnimeUpsertSet(baseRecord);

    assert.ok(
      set.kitsuId instanceof SQL,
      "kitsuId should be a SQL placeholder that references the existing column value",
    );
  });

  it("uses the incoming kitsuId when it is present", () => {
    const set = buildAnimeUpsertSet({ ...baseRecord, kitsuId: "185" });

    assert.equal(set.kitsuId, "185");
  });

  it("copies every other field unchanged from the record", () => {
    const set = buildAnimeUpsertSet({ ...baseRecord, title: "Changed", episodes: 12 });

    assert.equal(set.title, "Changed");
    assert.equal(set.episodes, 12);
    assert.equal(set.malId, baseRecord.malId);
  });
});
