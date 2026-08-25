import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

import type { Anime, AnimeProgress } from "../../../lib/api";
import { AnimeDetailHeader } from "./AnimeDetailHeader";

const anime = (overrides: Partial<Anime> = {}): Anime => ({
  id: 1,
  title: "Kimi no Na wa.",
  titleEnglish: "Your Name",
  titleJapanese: null,
  synopsis: "Una historia de encuentros, distancia y memoria.",
  imageUrl: "https://example.com/poster.jpg",
  bannerUrl: "https://example.com/banner.jpg",
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
  studio: "CoMix Wave Films",
  rating: null,
  duration: "1 hr 47 min",
  source: null,
  malId: 32281,
  kitsuId: null,
  hidden: false,
  syncedAt: "2026-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  genres: ["Drama", "Romance"],
  ...overrides,
});

const progress: AnimeProgress = {
  id: "progress-1",
  userId: "user-1",
  animeId: 1,
  season: 1,
  episode: 1,
  progressSeconds: 720,
  durationSeconds: 1440,
  watched: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("AnimeDetailHeader", () => {
  it("renders the cinematic hero with banner art and movie-specific CTA", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AnimeDetailHeader
          anime={anime()}
          continueWatching={progress}
          token={null}
          currentList={undefined}
          listMessage={null}
          onSaveList={() => undefined}
          onRemoveList={() => undefined}
        />
      </MemoryRouter>,
    );

    assert.match(html, /https:\/\/example.com\/banner.jpg/);
    assert.match(html, /data-testid="anime-detail-banner-strip"/);
    assert.match(html, /h-\[32vh\]/);
    assert.match(html, /max-h-\[300px\]/);
    assert.match(html, /object-center/);
    assert.match(html, /overflow-visible/);
    assert.match(html, /absolute left-6 top-6/);
    assert.match(html, /w-fit/);
    assert.match(html, /-mt-32/);
    assert.match(html, /lg:-mt-36/);
    assert.doesNotMatch(html, /150vh/);
    assert.doesNotMatch(html, /object-\[58%_30%\]/);
    assert.doesNotMatch(html, /rounded-\[2rem\].*bg-anime-surface/);
    assert.match(html, /Película/);
    assert.match(html, /Ver película/);
    assert.doesNotMatch(html, /Continuar episodio 1/);
  });

  it("prioritizes continue-watching copy for episodic series", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AnimeDetailHeader
          anime={anime({ title: "One Piece", format: "TV", episodes: 1120 })}
          continueWatching={{ ...progress, episode: 107 }}
          token={null}
          currentList={undefined}
          listMessage={null}
          onSaveList={() => undefined}
          onRemoveList={() => undefined}
        />
      </MemoryRouter>,
    );

    assert.match(html, /Continuar episodio 107/);
    assert.doesNotMatch(html, /Ver película/);
  });
});
