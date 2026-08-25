import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PgDialect } from "drizzle-orm/pg-core";

import { parseAnimeListQuery, publicRouteAnimeFilter } from "./anime.routes";

const toSql = (query: Parameters<PgDialect["sqlToQuery"]>[0]) => new PgDialect().sqlToQuery(query).sql;

describe("parseAnimeListQuery", () => {
  it("defaults Explore requests to relevance descending", () => {
    const query = parseAnimeListQuery({});

    assert.equal(query.sort, "relevance");
    assert.equal(query.order, "desc");
  });

  it("keeps rank ascending as its default ordering", () => {
    const query = parseAnimeListQuery({ sort: "rank" });

    assert.equal(query.sort, "rank");
    assert.equal(query.order, "asc");
  });

  it("preserves a valid format filter", () => {
    const query = parseAnimeListQuery({ format: "MOVIE" });

    assert.equal(query.format, "MOVIE");
    assert.equal(query.sort, "relevance");
    assert.equal(query.order, "desc");
  });

  it("ignores an invalid format filter without changing defaults", () => {
    const query = parseAnimeListQuery({ format: "SERIES", sort: "rank" });

    assert.equal(query.format, undefined);
    assert.equal(query.sort, "rank");
    assert.equal(query.order, "asc");
  });
});

describe("publicRouteAnimeFilter", () => {
  it("excludes hidden anime from public discovery route queries", () => {
    const sql = toSql(publicRouteAnimeFilter);

    assert.match(sql, /"animes"\."hidden" = \$1/);
  });
});
