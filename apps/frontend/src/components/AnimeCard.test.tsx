import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

import type { Anime } from "../lib/api";
import { AnimeCard } from "./AnimeCard";

const anime = (overrides: Partial<Anime> = {}): Anime => ({
  id: 1,
  title: "Kimi no Na wa.",
  titleEnglish: "Your Name",
  titleJapanese: null,
  synopsis: null,
  imageUrl: null,
  bannerUrl: null,
  trailerUrl: null,
  episodes: 1,
  status: "Finished Airing",
  score: "8.40",
  scoredBy: null,
  rank: null,
  popularity: null,
  anilistId: 1,
  format: "MOVIE",
  countryOfOrigin: "JP",
  startDate: null,
  averageScore: 84,
  anilistPopularity: 1000,
  trending: 0,
  relevanceScore: "100.00",
  year: 2016,
  season: null,
  studio: null,
  rating: null,
  duration: null,
  source: null,
  malId: 32281,
  kitsuId: null,
  hidden: false,
  syncedAt: "2026-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  genres: [],
  ...overrides,
});

describe("AnimeCard", () => {
  it("shows a movie badge and avoids awkward episode copy for films", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AnimeCard anime={anime()} />
      </MemoryRouter>,
    );

    assert.match(html, /Película/);
    assert.doesNotMatch(html, /1 episodio/);
    assert.doesNotMatch(html, /1 eps/);
  });

  it("shows series metadata with plural episode copy", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AnimeCard anime={anime({ title: "One Piece", format: "TV", episodes: 1120 })} />
      </MemoryRouter>,
    );

    assert.match(html, /Serie/);
    assert.match(html, /1120 episodios/);
  });
});
