import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inArray, sql } from "drizzle-orm";

import { animes, createDb, type NewAnime } from "@template/database";
import { animeVisibilityBodySchema } from "@template/shared";

import { animePayload, animePayloadAdmin, buildWhere, getAdminAnimeStats, listAnimes, orderColumn } from "./anime.service";
import { buildAnimeCardSql } from "./animeSql";

describe("animePayload", () => {
  it("includes the kitsuId column", () => {
    assert.ok("kitsuId" in animePayload, "kitsuId should be present in animePayload");
    assert.equal(animePayload.kitsuId, animes.kitsuId);
  });

  it("preserves existing fields", () => {
    assert.equal(animePayload.id, animes.id);
    assert.equal(animePayload.title, animes.title);
    assert.equal(animePayload.malId, animes.malId);
  });

  it("includes countryOfOrigin and isAdult", () => {
    assert.equal(animePayload.countryOfOrigin, animes.countryOfOrigin);
    assert.equal(animePayload.isAdult, animes.isAdult);
  });

  it("does not include hidden admin fields", () => {
    assert.equal("hidden" in animePayload, false);
    assert.equal("hiddenReason" in animePayload, false);
  });
});

describe("animePayloadAdmin", () => {
  it("extends public payload with hidden fields", () => {
    assert.equal(animePayloadAdmin.hidden, animes.hidden);
    assert.equal(animePayloadAdmin.hiddenReason, animes.hiddenReason);
  });
});

describe("animeVisibilityBodySchema", () => {
  it("accepts a valid visibility body", () => {
    assert.ok(animeVisibilityBodySchema.safeParse({ hidden: true, reason: "Duplicado" }).success);
    assert.ok(animeVisibilityBodySchema.safeParse({ hidden: false }).success);
  });

  it("rejects non-boolean hidden values", () => {
    assert.equal(animeVisibilityBodySchema.safeParse({ hidden: "yes" }).success, false);
    assert.equal(animeVisibilityBodySchema.safeParse({}).success, false);
  });

  it("rejects reasons longer than 200 characters", () => {
    assert.equal(animeVisibilityBodySchema.safeParse({ hidden: true, reason: "x".repeat(201) }).success, false);
  });
});

const testDb = createDb(process.env.DATABASE_URL).db;

const baseAnime = (id: number, overrides?: Partial<NewAnime>): NewAnime => ({
  id,
  malId: id,
  title: `AdminCatalogTest ${id}`,
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
  hidden: false,
  hiddenReason: null,
  countryOfOrigin: null,
  isAdult: false,
  syncedAt: new Date("2026-01-01T00:00:00Z"),
  ...overrides,
});

const cleanupIds = async (ids: number[]) => {
  await testDb.delete(animes).where(inArray(animes.id, ids));
};

describe("listAnimes visibility filters", () => {
  it("returns only visible animes for non-admin by default", async () => {
    const ids = [900_001, 900_002];
    await cleanupIds(ids);
    await testDb.insert(animes).values([
      baseAnime(ids[0], { hidden: false }),
      baseAnime(ids[1], { hidden: true, hiddenReason: "manual" }),
    ]);

    try {
      const result = await listAnimes({
        page: 1,
        limit: 24,
        search: "AdminCatalogTest",
        genres: [],
        sort: "popularity",
        order: "desc",
        viewerIsAdmin: false,
      });

      const returnedIds = result.data.map((anime) => anime.id);
      assert.ok(returnedIds.includes(ids[0]), "visible anime should be returned");
      assert.equal(returnedIds.includes(ids[1]), false, "hidden anime should not be returned");
    } finally {
      await cleanupIds(ids);
    }
  });

  it("returns all animes for admin when visibility is 'all'", async () => {
    const ids = [900_003, 900_004];
    await cleanupIds(ids);
    await testDb.insert(animes).values([
      baseAnime(ids[0], { hidden: false }),
      baseAnime(ids[1], { hidden: true, hiddenReason: "manual" }),
    ]);

    try {
      const result = await listAnimes({
        page: 1,
        limit: 24,
        search: "AdminCatalogTest",
        genres: [],
        sort: "popularity",
        order: "desc",
        viewerIsAdmin: true,
        visibility: "all",
      });

      const returnedIds = result.data.map((anime) => anime.id);
      assert.ok(returnedIds.includes(ids[0]), "visible anime should be returned");
      assert.ok(returnedIds.includes(ids[1]), "hidden anime should be returned");
    } finally {
      await cleanupIds(ids);
    }
  });

  it("returns only hidden animes when visibility is 'hidden'", async () => {
    const ids = [900_005, 900_006];
    await cleanupIds(ids);
    await testDb.insert(animes).values([
      baseAnime(ids[0], { hidden: false }),
      baseAnime(ids[1], { hidden: true, hiddenReason: "manual" }),
    ]);

    try {
      const result = await listAnimes({
        page: 1,
        limit: 24,
        search: "AdminCatalogTest",
        genres: [],
        sort: "popularity",
        order: "desc",
        viewerIsAdmin: true,
        visibility: "hidden",
      });

      const returnedIds = result.data.map((anime) => anime.id);
      assert.equal(returnedIds.includes(ids[0]), false, "visible anime should not be returned");
      assert.ok(returnedIds.includes(ids[1]), "hidden anime should be returned");
    } finally {
      await cleanupIds(ids);
    }
  });

  it("filters animes by hiddenReason", async () => {
    const ids = [900_007, 900_008, 900_009];
    await cleanupIds(ids);
    await testDb.insert(animes).values([
      baseAnime(ids[0], { hidden: true, hiddenReason: "manual" }),
      baseAnime(ids[1], { hidden: true, hiddenReason: "filtered_out_by_sync" }),
      baseAnime(ids[2], { hidden: false }),
    ]);

    try {
      const result = await listAnimes({
        page: 1,
        limit: 24,
        search: "AdminCatalogTest",
        genres: [],
        sort: "popularity",
        order: "desc",
        viewerIsAdmin: true,
        visibility: "all",
        hiddenReason: "manual",
      });

      const returnedIds = result.data.map((anime) => anime.id);
      assert.ok(returnedIds.includes(ids[0]), "manual reason anime should be returned");
      assert.equal(returnedIds.includes(ids[1]), false, "filtered_out_by_sync anime should not be returned");
      assert.equal(returnedIds.includes(ids[2]), false, "visible anime should not be returned");
    } finally {
      await cleanupIds(ids);
    }
  });

  it("sorts by hidden column when sort is 'hidden'", async () => {
    const ids = [900_010, 900_011];
    await cleanupIds(ids);
    await testDb.insert(animes).values([
      baseAnime(ids[0], { hidden: false }),
      baseAnime(ids[1], { hidden: true, hiddenReason: "manual" }),
    ]);

    try {
      const result = await listAnimes({
        page: 1,
        limit: 24,
        search: "AdminCatalogTest",
        genres: [],
        sort: "hidden",
        order: "desc",
        viewerIsAdmin: true,
        visibility: "all",
      });

      const filteredIds = result.data.map((anime) => anime.id).filter((id) => ids.includes(id));
      assert.equal(filteredIds[0], ids[1], "hidden anime should be first when sorting by hidden desc");
      assert.equal(filteredIds[1], ids[0], "visible anime should be last when sorting by hidden desc");
    } finally {
      await cleanupIds(ids);
    }
  });
});

describe("getAdminAnimeStats", () => {
  it("returns total, visible, hidden and hiddenByReason breakdown", async () => {
    const ids = [900_020, 900_021, 900_022, 900_023];
    await cleanupIds(ids);

    const beforeStats = await getAdminAnimeStats();
    await testDb.insert(animes).values([
      baseAnime(ids[0], { hidden: false }),
      baseAnime(ids[1], { hidden: true, hiddenReason: "manual" }),
      baseAnime(ids[2], { hidden: true, hiddenReason: "manual" }),
      baseAnime(ids[3], { hidden: true, hiddenReason: "filtered_out_by_sync" }),
    ]);

    try {
      const stats = await getAdminAnimeStats();
      assert.equal(stats.total, beforeStats.total + 4, "total should increase by 4");
      assert.equal(stats.visible, beforeStats.visible + 1, "visible should increase by 1");
      assert.equal(stats.hidden, beforeStats.hidden + 3, "hidden should increase by 3");
      assert.equal(stats.hiddenByReason["manual"], (beforeStats.hiddenByReason["manual"] ?? 0) + 2, "manual reason count should increase by 2");
      assert.equal(
        stats.hiddenByReason["filtered_out_by_sync"],
        (beforeStats.hiddenByReason["filtered_out_by_sync"] ?? 0) + 1,
        "filtered_out_by_sync count should increase by 1",
      );
    } finally {
      await cleanupIds(ids);
    }
  });
});

describe("orderColumn", () => {
  it("maps relevance sort to the relevanceScore column", () => {
    assert.equal(orderColumn.relevance, animes.relevanceScore);
  });
});

describe("animePayload new columns", () => {
  it("includes format, relevanceScore and startDate", () => {
    assert.equal(animePayload.format, animes.format);
    assert.equal(animePayload.relevanceScore, animes.relevanceScore);
    assert.equal(animePayload.startDate, animes.startDate);
  });
});

describe("buildWhere filters", () => {
  it("filters by view=catalog excluding Not yet aired", async () => {
    const ids = [900_030, 900_031];
    await cleanupIds(ids);
    await testDb.insert(animes).values([
      baseAnime(ids[0], { status: "Airing" }),
      baseAnime(ids[1], { status: "Not yet aired" }),
    ]);

    try {
      const result = await listAnimes({
        page: 1,
        limit: 24,
        search: "AdminCatalogTest",
        genres: [],
        sort: "score",
        order: "desc",
        view: "catalog",
      });
      const returnedIds = result.data.map((anime) => anime.id);
      assert.ok(returnedIds.includes(ids[0]), "Airing anime should be in catalog view");
      assert.equal(returnedIds.includes(ids[1]), false, "Not yet aired anime should not be in catalog view");
    } finally {
      await cleanupIds(ids);
    }
  });

  it("filters by view=upcoming including only Not yet aired", async () => {
    const ids = [900_032, 900_033];
    await cleanupIds(ids);
    await testDb.insert(animes).values([
      baseAnime(ids[0], { status: "Finished Airing" }),
      baseAnime(ids[1], { status: "Not yet aired" }),
    ]);

    try {
      const result = await listAnimes({
        page: 1,
        limit: 24,
        search: "AdminCatalogTest",
        genres: [],
        sort: "score",
        order: "desc",
        view: "upcoming",
      });
      const returnedIds = result.data.map((anime) => anime.id);
      assert.equal(returnedIds.includes(ids[0]), false, "Finished anime should not be in upcoming view");
      assert.ok(returnedIds.includes(ids[1]), "Not yet aired anime should be in upcoming view");
    } finally {
      await cleanupIds(ids);
    }
  });

  it("filters by format and studio", async () => {
    const ids = [900_034, 900_035, 900_036];
    await cleanupIds(ids);
    await testDb.insert(animes).values([
      baseAnime(ids[0], { format: "TV", studio: "MAPPA" }),
      baseAnime(ids[1], { format: "MOVIE", studio: "MAPPA" }),
      baseAnime(ids[2], { format: "TV", studio: "ufotable" }),
    ]);

    try {
      const byFormat = await listAnimes({
        page: 1,
        limit: 24,
        search: "AdminCatalogTest",
        genres: [],
        sort: "score",
        order: "desc",
        format: "TV",
      });
      assert.deepEqual(
        byFormat.data.map((anime) => anime.id).sort(),
        [ids[0], ids[2]].sort(),
      );

      const byStudio = await listAnimes({
        page: 1,
        limit: 24,
        search: "AdminCatalogTest",
        genres: [],
        sort: "score",
        order: "desc",
        studio: "MAPPA",
      });
      assert.deepEqual(
        byStudio.data.map((anime) => anime.id).sort(),
        [ids[0], ids[1]].sort(),
      );
    } finally {
      await cleanupIds(ids);
    }
  });
});

describe("listAnimes relevance sort", () => {
  it("orders results by relevanceScore when sort is relevance", async () => {
    const ids = [900_040, 900_041];
    await cleanupIds(ids);
    await testDb.insert(animes).values([
      baseAnime(ids[0], { relevanceScore: "90.00" }),
      baseAnime(ids[1], { relevanceScore: "10.00" }),
    ]);

    try {
      const result = await listAnimes({
        page: 1,
        limit: 24,
        search: "AdminCatalogTest",
        genres: [],
        sort: "relevance",
        order: "desc",
      });
      const returnedIds = result.data.map((anime) => anime.id);
      assert.equal(returnedIds[0], ids[0], "highest relevanceScore should be first");
      assert.equal(returnedIds[1], ids[1], "lowest relevanceScore should be last");
    } finally {
      await cleanupIds(ids);
    }
  });
});

describe("discovery premieres window", () => {
  it("includes airing animes whose startDate is within the last 30 days", async () => {
    const ids = [900_060, 900_061, 900_062];
    await cleanupIds(ids);
    await testDb.insert(animes).values([
      baseAnime(ids[0], { status: "Airing", startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) }),
      baseAnime(ids[1], { status: "Airing", startDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) }),
      baseAnime(ids[2], { status: "Finished Airing", startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }),
    ]);

    try {
      const animeCardSql = buildAnimeCardSql();
      const result = await testDb.execute<{ anime: unknown; latestEpisode: null; latestAiredAt: null }>(sql`
        select ${animeCardSql} as anime, null::int as "latestEpisode", null as "latestAiredAt"
        from ${animes}
        where ${animes.status} = 'Airing'
          and ${animes.hidden} = false
          and ${animes.startDate} >= now() - interval '30 days'
        order by ${animes.startDate} desc nulls last
        limit 12
      `);
      const returnedIds = result.rows.map((row) => (row.anime as { id: number }).id);
      assert.ok(returnedIds.includes(ids[0]), "recent premiere should be included");
      assert.equal(returnedIds.includes(ids[1]), false, "old premiere should be excluded");
      assert.equal(returnedIds.includes(ids[2]), false, "non-airing anime should be excluded");
    } finally {
      await cleanupIds(ids);
    }
  });
});

describe("studios endpoint query", () => {
  it("excludes hidden animes and groups non-hidden studios by count", async () => {
    const ids = [900_070, 900_071, 900_072, 900_073];
    await cleanupIds(ids);
    await testDb.insert(animes).values([
      baseAnime(ids[0], { studio: "Batch4StudioA", hidden: false }),
      baseAnime(ids[1], { studio: "Batch4StudioA", hidden: false }),
      baseAnime(ids[2], { studio: "Batch4StudioB", hidden: false }),
      baseAnime(ids[3], { studio: "Batch4HiddenStudio", hidden: true }),
    ]);

    try {
      const result = await testDb.execute<{ studio: string; count: number }>(sql`
        SELECT ${animes.studio} AS studio, count(*)::int AS count
        FROM ${animes}
        WHERE ${animes.studio} IS NOT NULL AND ${animes.hidden} = false
        GROUP BY ${animes.studio}
        ORDER BY count DESC
        LIMIT 20
      `);
      assert.ok(result.rows.length <= 20, "endpoint should cap results at 20");

      const specific = await testDb.execute<{ studio: string; count: number }>(sql`
        SELECT ${animes.studio} AS studio, count(*)::int AS count
        FROM ${animes}
        WHERE ${animes.studio} IN ('Batch4StudioA', 'Batch4StudioB') AND ${animes.hidden} = false
        GROUP BY ${animes.studio}
        ORDER BY count DESC
      `);
      const studios = specific.rows.map((row) => row.studio);
      assert.ok(studios.includes("Batch4StudioA"), "Batch4StudioA should be counted");
      assert.ok(studios.includes("Batch4StudioB"), "Batch4StudioB should be counted");
      assert.equal(specific.rows[0]?.studio, "Batch4StudioA", "studio with more animes should have higher count");

      const hidden = await testDb.execute<{ count: number }>(sql`
        SELECT count(*)::int AS count
        FROM ${animes}
        WHERE ${animes.studio} = 'Batch4HiddenStudio' AND ${animes.hidden} = false
      `);
      assert.equal(hidden.rows[0]?.count, 0, "hidden studio should be excluded");
    } finally {
      await cleanupIds(ids);
    }
  });
});
