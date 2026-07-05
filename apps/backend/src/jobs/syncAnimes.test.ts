import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SQL, sql } from "drizzle-orm";

import { animes, createDb, type NewAnime } from "@template/database";

import "../env";

import {
  buildAniListQuery,
  buildAnimeUpsertSet,
  mapAniListDuration,
  mapAniListSeason,
  mapAniListSource,
  mapAniListStatus,
  stripHtml,
} from "./syncAnimes.utils";
import {
  buildPostSyncCleanupSql,
  calculateRelevanceScore,
  buildRelevanceUpdateSql,
  isAllowedCountry,
  mapAniListMediumToAnime,
} from "./syncAnimes";

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
  anilistId: null,
  bannerUrl: null,
  anilistPopularity: null,
  syncedAt: new Date("2026-01-01T00:00:00Z"),
};

describe("buildAnimeUpsertSet", () => {
  it("uses SQL placeholders for preserve-if-null columns when incoming values are null", () => {
    const set = buildAnimeUpsertSet(baseRecord);

    assert.ok(set.synopsis instanceof SQL, "synopsis should preserve existing DB value");
    assert.ok(set.imageUrl instanceof SQL, "imageUrl should preserve existing DB value");
    assert.ok(set.trailerUrl instanceof SQL, "trailerUrl should preserve existing DB value");
    assert.ok(set.episodes instanceof SQL, "episodes should preserve existing DB value");
    assert.ok(set.rank instanceof SQL, "rank should preserve existing DB value");
    assert.ok(set.popularity instanceof SQL, "popularity should preserve existing DB value");
    assert.ok(set.startDate instanceof SQL, "startDate should preserve existing DB value");
    assert.ok(set.format instanceof SQL, "format should preserve existing DB value");
  });

  it("overwrites source-overwrite columns with incoming values", () => {
    const set = buildAnimeUpsertSet({
      ...baseRecord,
      title: "Changed",
      titleEnglish: "English",
      titleJapanese: "Japanese",
      status: "Airing",
      score: "8.50",
      year: 2024,
      season: "spring",
      studio: "MAPPA",
      duration: "23 min/ep",
      source: "Manga",
      bannerUrl: "https://example.com/banner.jpg",
      anilistId: 12345,
      anilistPopularity: 5000,
      startDate: new Date("2024-04-01T00:00:00.000Z"),
      format: "TV",
    });

    assert.equal(set.title, "Changed");
    assert.equal(set.titleEnglish, "English");
    assert.equal(set.titleJapanese, "Japanese");
    assert.equal(set.status, "Airing");
    assert.equal(set.score, "8.50");
    assert.equal(set.year, 2024);
    assert.equal(set.season, "spring");
    assert.equal(set.studio, "MAPPA");
    assert.equal(set.duration, "23 min/ep");
    assert.equal(set.source, "Manga");
    assert.equal(set.bannerUrl, "https://example.com/banner.jpg");
    assert.equal(set.anilistId, 12345);
    assert.equal(set.anilistPopularity, 5000);
    assert.deepEqual(set.startDate, new Date("2024-04-01T00:00:00.000Z"));
    assert.equal(set.format, "TV");
  });

  it("omits preserve-always columns from the upsert set", () => {
    const set = buildAnimeUpsertSet({
      ...baseRecord,
      kitsuId: "185",
      imdbId: "tt12345",
      scoredBy: 1000,
      rating: "PG-13",
    });

    assert.equal("kitsuId" in set, false, "kitsuId should not be in upsert set");
    assert.equal("imdbId" in set, false, "imdbId should not be in upsert set");
    assert.equal("scoredBy" in set, false, "scoredBy should not be in upsert set");
    assert.equal("rating" in set, false, "rating should not be in upsert set");
  });

  it("omits id and createdAt from the upsert set", () => {
    const set = buildAnimeUpsertSet(baseRecord);

    assert.equal("id" in set, false, "id should not be in upsert set");
    assert.equal("createdAt" in set, false, "createdAt should not be in upsert set");
  });
});

describe("mapAniListStatus", () => {
  it("maps known statuses to Jikan-style strings", () => {
    assert.equal(mapAniListStatus("FINISHED"), "Finished Airing");
    assert.equal(mapAniListStatus("RELEASING"), "Airing");
    assert.equal(mapAniListStatus("NOT_YET_RELEASED"), "Not yet aired");
    assert.equal(mapAniListStatus("CANCELLED"), "Finished Airing");
    assert.equal(mapAniListStatus("HIATUS"), "Airing");
  });

  it("returns null for null or unknown statuses", () => {
    assert.equal(mapAniListStatus(null), null);
    assert.equal(mapAniListStatus("UNKNOWN" as Parameters<typeof mapAniListStatus>[0]), null);
  });
});

describe("mapAniListSource", () => {
  it("maps all 14 AniList source enums to Title Case", () => {
    assert.equal(mapAniListSource("ORIGINAL"), "Original");
    assert.equal(mapAniListSource("MANGA"), "Manga");
    assert.equal(mapAniListSource("LIGHT_NOVEL"), "Light Novel");
    assert.equal(mapAniListSource("VISUAL_NOVEL"), "Visual Novel");
    assert.equal(mapAniListSource("VIDEO_GAME"), "Video Game");
    assert.equal(mapAniListSource("OTHER"), "Other");
    assert.equal(mapAniListSource("MUSIC"), "Music");
    assert.equal(mapAniListSource("GAME"), "Game");
    assert.equal(mapAniListSource("COMIC"), "Comic");
    assert.equal(mapAniListSource("NOVEL"), "Novel");
    assert.equal(mapAniListSource("DOUJINSHI"), "Doujinshi");
    assert.equal(mapAniListSource("MULTIMEDIA_PROJECT"), "Multimedia Project");
    assert.equal(mapAniListSource("PICTURE_BOOK"), "Picture Book");
    assert.equal(mapAniListSource("RADIO"), "Radio");
  });

  it("returns null for null or unknown sources", () => {
    assert.equal(mapAniListSource(null), null);
    assert.equal(mapAniListSource("UNKNOWN" as Parameters<typeof mapAniListSource>[0]), null);
  });
});

describe("mapAniListDuration", () => {
  it("returns null when duration is null", () => {
    assert.equal(mapAniListDuration(null, "TV"), null);
    assert.equal(mapAniListDuration(null, "MOVIE"), null);
  });

  it("formats TV, OVA, ONA and SPECIAL as minutes per episode", () => {
    assert.equal(mapAniListDuration(23, "TV"), "23 min/ep");
    assert.equal(mapAniListDuration(1, "OVA"), "1 min/ep");
    assert.equal(mapAniListDuration(24, "ONA"), "24 min/ep");
    assert.equal(mapAniListDuration(42, "SPECIAL"), "42 min/ep");
  });

  it("formats MOVIE durations in hours and minutes or minutes", () => {
    assert.equal(mapAniListDuration(98, "MOVIE"), "1 hr 38 min");
    assert.equal(mapAniListDuration(45, "MOVIE"), "45 min");
    assert.equal(mapAniListDuration(60, "MOVIE"), "1 hr 0 min");
  });
});

describe("mapAniListSeason", () => {
  it("maps known seasons to lowercase", () => {
    assert.equal(mapAniListSeason("WINTER"), "winter");
    assert.equal(mapAniListSeason("SPRING"), "spring");
    assert.equal(mapAniListSeason("SUMMER"), "summer");
    assert.equal(mapAniListSeason("FALL"), "fall");
  });

  it("returns null for null or unknown seasons", () => {
    assert.equal(mapAniListSeason(null), null);
    assert.equal(mapAniListSeason("UNKNOWN" as Parameters<typeof mapAniListSeason>[0]), null);
  });
});

describe("stripHtml", () => {
  it("replaces br tags with newlines and collapses excessive newlines", () => {
    assert.equal(stripHtml("<br>Luffy<br><br>One Piece</br>"), "Luffy\n\nOne Piece");
    assert.equal(stripHtml("a<br><br><br>b"), "a\n\nb");
  });

  it("handles uppercase br tags", () => {
    assert.equal(stripHtml("<BR>text</BR>"), "text");
  });

  it("removes tags and keeps text", () => {
    assert.equal(stripHtml("<b>bold</b>"), "bold");
    assert.equal(stripHtml("<div><p>hello</p></div>"), "hello");
  });

  it("does not decode HTML entities", () => {
    assert.equal(stripHtml("&amp;"), "&amp;");
  });

  it("returns an empty string for empty input", () => {
    assert.equal(stripHtml(""), "");
  });
});

describe("buildAniListQuery", () => {
  it("builds the correct query and variables for TV page 1", () => {
    const { query, variables } = buildAniListQuery("TV", 1);
    const normalized = query.replace(/\s+/g, " ");

    assert.ok(normalized.includes("Page(page: $page, perPage: 50)"));
    assert.ok(normalized.includes("media(type: ANIME, format: $format, isAdult: false, popularity_greater: 1000, sort: POPULARITY_DESC)"));
    assert.deepEqual(variables, { format: "TV", page: 1 });

    for (const field of [
      "id",
      "idMal",
      "title { romaji english native }",
      "description",
      "averageScore",
      "popularity",
      "episodes",
      "status",
      "season",
      "seasonYear",
      "startDate { year month day }",
      "duration",
      "source",
      "format",
      "coverImage { extraLarge }",
      "bannerImage",
      "studios { nodes { id name isAnimationStudio } }",
      "genres",
      "rankings { type allTime rank }",
    ]) {
      assert.ok(normalized.includes(field), `expected query to include ${field}`);
    }
  });

  it("builds the correct query and variables for MOVIE page 5", () => {
    const { query, variables } = buildAniListQuery("MOVIE", 5);

    assert.ok(query.includes("Page(page: $page, perPage: 50)"));
    assert.deepEqual(variables, { format: "MOVIE", page: 5 });
  });

  it("includes isAdult false and popularity_greater in the media args", () => {
    const { query } = buildAniListQuery("TV", 1);
    const normalized = query.replace(/\s+/g, " ");

    assert.ok(normalized.includes("isAdult: false"), "expected isAdult: false in media args");
    assert.ok(normalized.includes("popularity_greater: 1000"), "expected popularity_greater: 1000 in media args");
  });

  it("requests countryOfOrigin and isAdult fields", () => {
    const { query } = buildAniListQuery("TV", 1);
    const normalized = query.replace(/\s+/g, " ");

    assert.ok(normalized.includes("countryOfOrigin"), "expected countryOfOrigin field");
    assert.ok(normalized.includes("isAdult"), "expected isAdult field");
  });
});

describe("isAllowedCountry", () => {
  it("allows JP, KR and CN", () => {
    assert.equal(isAllowedCountry("JP"), true);
    assert.equal(isAllowedCountry("KR"), true);
    assert.equal(isAllowedCountry("CN"), true);
  });

  it("skips other countries and null/undefined", () => {
    assert.equal(isAllowedCountry("US"), false);
    assert.equal(isAllowedCountry("FR"), false);
    assert.equal(isAllowedCountry(""), false);
    assert.equal(isAllowedCountry(null), false);
    assert.equal(isAllowedCountry(undefined), false);
  });
});

const testDb = createDb(process.env.DATABASE_URL).db;

describe("buildPostSyncCleanupSql", () => {
  it("hides stale visible animes and preserves already-hidden rows", async () => {
    const syncStartedAt = new Date("2026-06-21T12:00:00Z");
    const testId = 999_999;

    await testDb.transaction(async (tx) => {
      await tx
        .insert(animes)
        .values({
          id: testId,
          malId: testId,
          title: "Cleanup Test",
          hidden: false,
          syncedAt: new Date("2026-01-01T00:00:00Z"),
        } as NewAnime)
        .onConflictDoNothing();

      const before = await tx.select({ hidden: animes.hidden }).from(animes).where(sql`${animes.id} = ${testId}`);
      assert.equal(before[0]?.hidden, false);

      await tx.execute(buildPostSyncCleanupSql(syncStartedAt));

      const after = await tx.select({ hidden: animes.hidden, hiddenReason: animes.hiddenReason }).from(animes).where(sql`${animes.id} = ${testId}`);
      assert.equal(after[0]?.hidden, true);
      assert.equal(after[0]?.hiddenReason, "filtered_out_by_sync");

      // Force rollback so the test row does not pollute the database.
      throw new Error("rollback");
    }).catch((error: unknown) => {
      if ((error as Error).message !== "rollback") throw error;
    });
  });

  it("skips rows that are already hidden (idempotency)", async () => {
    const syncStartedAt = new Date("2026-06-21T12:00:00Z");
    const testId = 999_998;

    await testDb.transaction(async (tx) => {
      await tx
        .insert(animes)
        .values({
          id: testId,
          malId: testId,
          title: "Cleanup Idempotency Test",
          hidden: true,
          hiddenReason: "manual",
          syncedAt: new Date("2026-01-01T00:00:00Z"),
        } as NewAnime)
        .onConflictDoNothing();

      await tx.execute(buildPostSyncCleanupSql(syncStartedAt));

      const after = await tx.select({ hidden: animes.hidden, hiddenReason: animes.hiddenReason }).from(animes).where(sql`${animes.id} = ${testId}`);
      assert.equal(after[0]?.hidden, true);
      assert.equal(after[0]?.hiddenReason, "manual");

      throw new Error("rollback");
    }).catch((error: unknown) => {
      if ((error as Error).message !== "rollback") throw error;
    });
  });
});

const baseMedium: Parameters<typeof mapAniListMediumToAnime>[0] = {
  id: 1,
  idMal: 1,
  title: { romaji: "Test", english: "Test EN", native: "Test JP" },
  description: "<p>Description</p>",
  averageScore: 80,
  popularity: 1000,
  episodes: 12,
  status: "RELEASING",
  season: "SPRING",
  seasonYear: 2024,
  startDate: { year: 2024, month: 4, day: 1 },
  duration: 23,
  source: "MANGA",
  format: "TV",
  coverImage: { extraLarge: "https://example.com/cover.jpg" },
  bannerImage: "https://example.com/banner.jpg",
  studios: { nodes: [{ id: 1, name: "MAPPA", isAnimationStudio: true }] },
  genres: ["Action"],
  rankings: [{ type: "RATED", allTime: true, rank: 100 }],
  countryOfOrigin: "JP",
  isAdult: false,
};

describe("mapAniListMediumToAnime", () => {
  it("maps a complete startDate to a JS Date using 0-indexed months", () => {
    const anime = mapAniListMediumToAnime(baseMedium);

    assert.ok(anime.startDate instanceof Date);
    assert.equal(anime.startDate.getUTCFullYear(), 2024);
    assert.equal(anime.startDate.getUTCMonth(), 3);
    assert.equal(anime.startDate.getUTCDate(), 1);
  });

  it("falls back to month 1 and day 1 when startDate parts are null", () => {
    const anime = mapAniListMediumToAnime({ ...baseMedium, startDate: { year: 2024, month: null, day: null } });

    assert.ok(anime.startDate instanceof Date);
    assert.equal(anime.startDate.getUTCMonth(), 0);
    assert.equal(anime.startDate.getUTCDate(), 1);
  });

  it("maps null startDate to null", () => {
    const anime = mapAniListMediumToAnime({ ...baseMedium, startDate: null });
    assert.equal(anime.startDate, null);
  });

  it("maps format to the raw AniList enum value or null", () => {
    assert.equal(mapAniListMediumToAnime(baseMedium).format, "TV");
    assert.equal(mapAniListMediumToAnime({ ...baseMedium, format: null }).format, null);
  });
});

describe("calculateRelevanceScore", () => {
  const currentYear = 2026;

  it("treats null score as zero and null year as zero recency", () => {
    const score = calculateRelevanceScore({ score: null, year: null, status: null, popPercentile: 0, currentYear });
    assert.equal(score, (0.3 * 0.15) * 100);
  });

  it("returns the maximum score when all components are at their best", () => {
    const score = calculateRelevanceScore({ score: "10.00", year: currentYear, status: "Airing", popPercentile: 1, currentYear });
    assert.equal(Math.round(score * 100) / 100, 100);
  });

  it("caps recency at zero for years before 1990", () => {
    const score = calculateRelevanceScore({ score: "10.00", year: 1980, status: "Airing", popPercentile: 1, currentYear });
    assert.equal(score, (0.30 + 0.40 + 0 + 0.15) * 100);
  });

  it("maps status bonuses correctly", () => {
    assert.equal(
      calculateRelevanceScore({ score: null, year: null, status: "Airing", popPercentile: 0, currentYear }),
      (1.0 * 0.15) * 100,
    );
    assert.equal(
      calculateRelevanceScore({ score: null, year: null, status: "Finished Airing", popPercentile: 0, currentYear }),
      (0.6 * 0.15) * 100,
    );
    assert.equal(
      calculateRelevanceScore({ score: null, year: null, status: "Not yet aired", popPercentile: 0, currentYear }),
      (0.1 * 0.15) * 100,
    );
  });
});

describe("buildRelevanceUpdateSql", () => {
  it("updates relevanceScore for visible animes using the formula", async () => {
    const testId = 999_997;

    await testDb.transaction(async (tx) => {
      await tx
        .insert(animes)
        .values({
          id: testId,
          malId: testId,
          title: "Relevance Test",
          hidden: false,
          score: "10.00",
          year: 2026,
          status: "Airing",
          anilistPopularity: 1000,
        } as NewAnime)
        .onConflictDoNothing();

      await tx.execute(buildRelevanceUpdateSql());

      const after = await tx.select({ relevanceScore: animes.relevanceScore }).from(animes).where(sql`${animes.id} = ${testId}`);
      assert.ok(after[0]?.relevanceScore != null);
      assert.ok(Number(after[0]?.relevanceScore) > 0);

      throw new Error("rollback");
    }).catch((error: unknown) => {
      if ((error as Error).message !== "rollback") throw error;
    });
  });
});
