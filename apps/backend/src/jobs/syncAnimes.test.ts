import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SQL } from "drizzle-orm";

import type { NewAnime } from "@template/database";

import { dedupeMedia, selectCatalogMedia } from "./syncAnimes";
import { buildAnimeUpsertSet } from "./syncAnimes.utils";
import type { AniListMedia } from "./anilist/types";

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

  it("preserves an existing DB imdbId when the incoming record has null", () => {
    const set = buildAnimeUpsertSet(baseRecord);

    assert.ok(
      set.imdbId instanceof SQL,
      "imdbId should be a SQL placeholder that references the existing column value",
    );
  });

  it("uses the incoming imdbId when it is present", () => {
    const set = buildAnimeUpsertSet({ ...baseRecord, imdbId: "tt1355642" });

    assert.equal(set.imdbId, "tt1355642");
  });

  it("copies every other field unchanged from the record", () => {
    const set = buildAnimeUpsertSet({ ...baseRecord, title: "Changed", episodes: 12 });

    assert.equal(set.title, "Changed");
    assert.equal(set.episodes, 12);
    assert.equal(set.malId, baseRecord.malId);
  });
});

const media = (overrides: Partial<AniListMedia>): AniListMedia => ({
  id: 1,
  idMal: 1,
  title: { romaji: "Test", english: null, native: null },
  description: null,
  coverImage: null,
  bannerImage: null,
  episodes: null,
  status: "FINISHED",
  averageScore: 70,
  meanScore: 70,
  popularity: 1_000,
  favourites: 0,
  season: null,
  seasonYear: 2026,
  format: "TV",
  countryOfOrigin: "JP",
  source: null,
  genres: [],
  studios: { nodes: [] },
  externalLinks: [],
  startDate: null,
  ...overrides,
});

describe("dedupeMedia", () => {
  it("dedupes lane overlaps by MAL identity and keeps the stronger candidate", () => {
    const result = dedupeMedia([
      media({ id: 10, idMal: 100, averageScore: 95, popularity: 1_000, favourites: 2_000 }),
      media({ id: 10, idMal: 100, averageScore: 60, popularity: 50_000, favourites: 10 }),
      media({ id: 11, idMal: 101, popularity: 2_000 }),
    ]);

    assert.equal(result.length, 2);
    assert.equal(result[0]?.idMal, 100);
    assert.equal(result[0]?.averageScore, 95);
  });

  it("merges complementary genres across duplicate lane results", () => {
    const result = dedupeMedia([
      media({ id: 10, idMal: 100, genres: ["Action", "Drama"], popularity: 5_000 }),
      media({ id: 10, idMal: 100, genres: ["Drama", "Fantasy"], popularity: 1_000 }),
    ]);

    assert.deepEqual(result[0]?.genres, ["Action", "Drama", "Fantasy"]);
  });

  it("drops entries without MAL identity before upsert", () => {
    const result = dedupeMedia([media({ id: 10, idMal: null }), media({ id: 11, idMal: 101 })]);

    assert.deepEqual(result.map((item) => item.idMal), [101]);
  });
});

describe("selectCatalogMedia", () => {
  it("keeps only quality candidates and caps final catalog by relevance", () => {
    const result = selectCatalogMedia(
      [
        media({ id: 10, idMal: 100, averageScore: 70, popularity: 1_000, favourites: 1 }),
        media({ id: 11, idMal: 101, averageScore: 95, popularity: 5_000, favourites: 5_000 }),
        media({ id: 12, idMal: 102, averageScore: 30, popularity: 500 }),
      ],
      1,
    );

    assert.deepEqual(result.selected.map((item) => item.idMal), [101]);
    assert.equal(result.discards.low_quality_threshold, 1);
  });
});
