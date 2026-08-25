import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ANILIST_CATALOG_QUERY, buildLaneVariables, catalogLanes } from "./query";

describe("AniList query contract", () => {
  it("builds the JP/KR/CN by TV/MOVIE/ONA/OVA/SPECIAL lane sweep", () => {
    assert.equal(catalogLanes.length, 15);
    assert.deepEqual(catalogLanes[0], { countryOfOrigin: "JP", format: "TV" });
    assert.deepEqual(catalogLanes.at(-1), { countryOfOrigin: "CN", format: "SPECIAL" });
  });

  it("uses GraphQL variables required by the catalog query", () => {
    assert.deepEqual(buildLaneVariables({ countryOfOrigin: "KR", format: "ONA" }, 3), {
      page: 3,
      perPage: 50,
      countryOfOrigin: "KR",
      format: "ONA",
      blockedGenres: ["Hentai", "Erotica", "Boys Love", "Girls Love", "Kids", "Music", "Avant Garde"],
      blockedTags: ["Hentai", "Erotica", "Boys Love", "Girls Love", "Kids", "Music", "Avant Garde", "Sexual Content", "Nudity"],
    });
    assert.match(ANILIST_CATALOG_QUERY, /idMal/);
    assert.match(ANILIST_CATALOG_QUERY, /isAdult: false/);
    assert.match(ANILIST_CATALOG_QUERY, /genre_not_in: \$blockedGenres/);
    assert.match(ANILIST_CATALOG_QUERY, /tag_not_in: \$blockedTags/);
    assert.match(ANILIST_CATALOG_QUERY, /sort: \[POPULARITY_DESC, SCORE_DESC\]/);
  });
});
