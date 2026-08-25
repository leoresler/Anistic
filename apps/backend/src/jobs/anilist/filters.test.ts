import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { filterAniListMedia } from "./filters";

describe("filterAniListMedia", () => {
  it("keeps TV/MOVIE/ONA entries that meet score and popularity thresholds", () => {
    const result = filterAniListMedia({ id: 16498, idMal: 5114, isAdult: false, format: "TV", genres: ["Action"], status: "FINISHED", averageScore: 92, popularity: 450_000 });

    assert.deepEqual(result, { keep: true });
  });

  it("rejects weak upcoming entries and counts the policy reason", () => {
    const result = filterAniListMedia({ id: 1, idMal: 2, isAdult: false, format: "TV", genres: ["Action"], status: "NOT_YET_RELEASED", averageScore: null, popularity: 9_999 });

    assert.deepEqual(result, { keep: false, reason: "not_released_low_popularity" });
  });

  it("allows Ecchi but rejects blocked quality genres", () => {
    assert.deepEqual(filterAniListMedia({ id: 1, idMal: 2, isAdult: false, format: "OVA", genres: ["Ecchi"], status: "FINISHED", averageScore: 70, popularity: 4_000 }), { keep: true });
    assert.deepEqual(filterAniListMedia({ id: 1, idMal: 2, isAdult: false, format: "TV", genres: ["Kids"], status: "FINISHED", averageScore: 80, popularity: 5_000 }), { keep: false, reason: "blocked_genre" });
  });
});
