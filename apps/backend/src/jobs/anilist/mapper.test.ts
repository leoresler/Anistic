import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapAniListMediaToAnime } from "./mapper";

describe("mapAniListMediaToAnime", () => {
  it("preserves MAL identity while storing AniList metadata separately", () => {
    const mapped = mapAniListMediaToAnime({
      id: 16498,
      idMal: 5114,
      title: { romaji: "Fullmetal Alchemist: Brotherhood", english: "Fullmetal Alchemist: Brotherhood", native: "鋼の錬金術師" },
      description: "Alchemy.",
      coverImage: { extraLarge: "cover-extra", large: "cover-large" },
      bannerImage: "banner",
      episodes: 64,
      status: "FINISHED",
      averageScore: 92,
      meanScore: 91,
      popularity: 450_000,
      favourites: 200_000,
      season: "SPRING",
      seasonYear: 2009,
      format: "TV",
      countryOfOrigin: "JP",
      source: "MANGA",
      genres: ["Action", "Adventure"],
      studios: { nodes: [{ name: "Bones" }] },
      externalLinks: [{ site: "IMDB", url: "https://www.imdb.com/title/tt1355642/" }],
      startDate: { year: 2009, month: 4, day: 5 },
    });

    assert.equal(mapped.anime.id, 5114);
    assert.equal(mapped.anime.malId, 5114);
    assert.equal(mapped.anime.anilistId, 16498);
    assert.equal(mapped.anime.imdbId, "tt1355642");
    assert.deepEqual(mapped.genres, ["Action", "Adventure"]);
  });

  it("stores incomplete AniList dates as null", () => {
    const mapped = mapAniListMediaToAnime({
      id: 1,
      idMal: 2,
      title: { romaji: "Partial Date", english: null, native: null },
      description: null,
      coverImage: { extraLarge: null, large: null },
      bannerImage: null,
      episodes: null,
      status: "RELEASING",
      averageScore: 70,
      meanScore: 70,
      popularity: 2_000,
      favourites: 50,
      season: null,
      seasonYear: 2026,
      format: "ONA",
      countryOfOrigin: "JP",
      source: null,
      genres: [],
      studios: { nodes: [] },
      externalLinks: [],
      startDate: { year: 2026, month: 7, day: null },
    });

    assert.equal(mapped.anime.startDate, null);
  });
});
