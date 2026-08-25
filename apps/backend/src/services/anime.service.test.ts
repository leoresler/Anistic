import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { animes } from "@template/database";
import { PgDialect } from "drizzle-orm/pg-core";

import { animePayload, buildAnimeByIdWhere, buildAnimeStatsSql, buildListAnimeGenresSql, buildWhere, orderColumn, type ListAnimesInput } from "./anime.service";

const toSql = (query: Parameters<PgDialect["sqlToQuery"]>[0]) => new PgDialect().sqlToQuery(query).sql;

const baseListInput: ListAnimesInput = {
  page: 1,
  limit: 24,
  genres: [],
  sort: "relevance",
  order: "desc",
};

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

  it("includes AniList-backed catalog fields", () => {
    assert.equal(animePayload.anilistId, animes.anilistId);
    assert.equal(animePayload.format, animes.format);
    assert.equal(animePayload.countryOfOrigin, animes.countryOfOrigin);
    assert.equal(animePayload.averageScore, animes.averageScore);
    assert.equal(animePayload.relevanceScore, animes.relevanceScore);
  });

  it("supports relevance ordering through the stored relevance score", () => {
    assert.equal(orderColumn.relevance, animes.relevanceScore);
  });
});

describe("public anime visibility filters", () => {
  it("filters hidden rows from detail lookups", () => {
    const sql = toSql(buildAnimeByIdWhere(1));

    assert.match(sql, /"animes"\."id" = \$1/);
    assert.match(sql, /"animes"\."hidden" = \$2/);
  });

  it("filters hidden rows from genre discovery", () => {
    const sql = toSql(buildListAnimeGenresSql());

    assert.match(sql, /inner join "animes"/);
    assert.match(sql, /"animes"\."hidden" = \$1/);
  });

  it("filters hidden rows from catalog stats and facets", () => {
    const sql = toSql(buildAnimeStatsSql());

    assert.match(sql, /from animes where hidden = false/);
    assert.match(sql, /from anime_genres ag inner join animes a on a\.id = ag\.anime_id where a\.hidden = false/);
    assert.match(sql, /from animes where hidden = false and year is not null/);
  });
});

describe("buildWhere", () => {
  it("filters by format when provided and keeps public visibility", () => {
    const where = buildWhere({ ...baseListInput, format: "MOVIE" });
    assert.ok(where);
    const sql = toSql(where);

    assert.match(sql, /"animes"\."format" = \$1/);
    assert.match(sql, /"animes"\."hidden" = \$2/);
  });

  it("omits the format predicate when no format is provided", () => {
    const where = buildWhere(baseListInput);
    assert.ok(where);
    const sql = toSql(where);

    assert.doesNotMatch(sql, /"animes"\."format"/);
    assert.match(sql, /"animes"\."hidden" = \$1/);
  });
});
