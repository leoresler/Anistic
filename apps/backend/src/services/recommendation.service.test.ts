import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PgDialect } from "drizzle-orm/pg-core";

import { publicRecommendationAnimeFilter } from "./recommendation.service";

const toSql = (query: Parameters<PgDialect["sqlToQuery"]>[0]) => new PgDialect().sqlToQuery(query).sql;

describe("publicRecommendationAnimeFilter", () => {
  it("excludes hidden anime from recommendation queries that select from animes", () => {
    const sql = toSql(publicRecommendationAnimeFilter);

    assert.match(sql, /"animes"\."hidden" = \$1/);
  });
});
