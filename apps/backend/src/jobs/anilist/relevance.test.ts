import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { computeRelevanceScore } from "./relevance";

describe("computeRelevanceScore", () => {
  it("rewards quality and reach signals deterministically", () => {
    const high = computeRelevanceScore({ averageScore: 92, meanScore: 91, popularity: 450_000, favourites: 200_000, seasonYear: 2009, status: "FINISHED" }, 2026);
    const low = computeRelevanceScore({ averageScore: 65, meanScore: 64, popularity: 3_000, favourites: 100, seasonYear: 2009, status: "FINISHED" }, 2026);

    assert.ok(high > low);
    assert.equal(high, computeRelevanceScore({ averageScore: 92, meanScore: 91, popularity: 450_000, favourites: 200_000, seasonYear: 2009, status: "FINISHED" }, 2026));
  });

  it("caps upcoming null-score entries unless they have strong reach", () => {
    const upcoming = computeRelevanceScore({ averageScore: null, meanScore: null, popularity: 10_000, favourites: 1_000, seasonYear: 2027, status: "NOT_YET_RELEASED" }, 2026);

    assert.ok(upcoming <= 140);
    assert.ok(upcoming > 0);
  });
});
