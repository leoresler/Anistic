import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";

import type { AnimeEpisode } from "@template/shared";

import type { Anime, AnimeProgress, Stream } from "../../../lib/api";
import { AnimeDetailEpisodeSection, EpisodeSourcesPanel, streamKey } from "./AnimeDetailEpisodeSection";

const anime = (overrides: Partial<Anime> = {}): Anime => ({
  id: 1,
  title: "One Piece",
  titleEnglish: null,
  titleJapanese: null,
  synopsis: null,
  imageUrl: null,
  bannerUrl: null,
  trailerUrl: null,
  episodes: 121,
  status: "Airing",
  score: "8.70",
  scoredBy: null,
  rank: null,
  popularity: null,
  anilistId: 1,
  format: "TV",
  countryOfOrigin: "JP",
  startDate: null,
  averageScore: 87,
  anilistPopularity: 1000,
  trending: 0,
  relevanceScore: "100.00",
  year: 1999,
  season: null,
  studio: null,
  rating: null,
  duration: null,
  source: null,
  malId: 21,
  kitsuId: null,
  hidden: false,
  syncedAt: "2026-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  genres: [],
  ...overrides,
});

const episodes = Array.from({ length: 121 }, (_, index): AnimeEpisode => ({
  animeId: 1,
  season: 1,
  episode: index + 1,
  title: `Episode ${index + 1}`,
  thumbnailUrl: null,
  airedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
}));

const progress: AnimeProgress = {
  id: "progress-1",
  userId: "user-1",
  animeId: 1,
  season: 1,
  episode: 107,
  durationSeconds: 1440,
  progressSeconds: 720,
  watched: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const renderPanelWithStreams = (streams: Stream[]) => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(["addon-streams", 21, 1, 107], {
    streams,
    addonResults: [{ addonName: "Community Addon", status: "ok", streamCount: streams.length }],
  });

  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <EpisodeSourcesPanel animeTitle="One Piece" malId={21} season={1} episode={107} onBack={() => undefined} />
    </QueryClientProvider>,
  );
};

describe("AnimeDetailEpisodeSection", () => {
  it("uses the render index as a last-resort stream key tiebreaker", () => {
    const stream: Stream = {
      addonName: "Community Addon",
      title: "One Piece S01E107 1080p WEB-DL",
      resolution: "1080p",
      type: "torrent",
      magnet: "magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567",
    };

    assert.notEqual(streamKey(stream, 0), streamKey(stream, 1));
  });

  it("renders a hidden-scroll chapter column and expands the continue-watching chapter", () => {
    const html = renderToStaticMarkup(
      <AnimeDetailEpisodeSection
        anime={anime()}
        episodes={episodes}
        progress={[progress]}
        continueWatching={progress}
        season={1}
        onSeasonChange={() => undefined}
        manualEpisode={1}
        onManualEpisodeChange={() => undefined}
      />,
    );

    assert.match(html, /data-testid="episode-scroll-container"/);
    assert.match(html, /scrollbar-none/);
    assert.match(html, /basis-0/);
    assert.match(html, /rounded-xl/);
    assert.match(html, /Capítulo 101/);
    assert.match(html, /Capítulo 107/);
    assert.match(html, /aria-expanded="true"/);
    assert.match(html, /Ver capítulo/);
    assert.doesNotMatch(html, /href="\/watch\/21\?season=1&amp;episode=107"[\s\S]*Ver capítulo/);
    assert.doesNotMatch(html, /EP 101/);
    assert.doesNotMatch(html, /Eps 1-50/);
    assert.match(html, /Descripción no disponible todavía/);
  });

  it("renders a same-size internal-scroll sources panel with real addon streams for the selected chapter", () => {
    const html = renderPanelWithStreams([
      {
        addonName: "Community Addon",
        title: "One Piece S01E107 1080p WEB-DL",
        resolution: "1080p",
        type: "torrent",
        magnet: "magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567",
        seeders: 42,
        language: "JP",
        subtitles: ["ES"],
      },
    ]);

    assert.match(html, /data-testid="episode-sources-panel"/);
    assert.match(html, /scrollbar-none/);
    assert.match(html, /basis-0/);
    assert.match(html, /Capítulo 107/);
    assert.match(html, /Fuentes disponibles/);
    assert.match(html, /Community Addon/);
    assert.match(html, /One Piece S01E107 1080p WEB-DL/);
    assert.match(html, /1080p/);
    assert.match(html, /Seeders 42/);
    assert.match(html, /JP/);
    assert.match(html, /Subs: ES/);
    assert.match(html, /button type="button"[\s\S]*One Piece S01E107 1080p WEB-DL/);
    assert.doesNotMatch(html, /Anistic Addon/);
    assert.doesNotMatch(html, /Servidor Latino/);
    assert.doesNotMatch(html, /Reproducir/);
    assert.doesNotMatch(html, /href="\/watch/);
  });

  it("renders a generic addon configuration CTA when no streams are available", () => {
    const html = renderPanelWithStreams([]);

    assert.match(html, /No encontramos fuentes para este capítulo/);
    assert.match(html, /Configurar addons/);
    assert.match(html, /href="\/addons"/);
    assert.doesNotMatch(html, /Torrentio/);
    assert.doesNotMatch(html, /Servidor Latino/);
  });

  it("renders movie mode without episodic range/search UI", () => {
    const html = renderToStaticMarkup(
      <AnimeDetailEpisodeSection
        anime={anime({ title: "Kimi no Na wa.", format: "MOVIE", episodes: 1, duration: "1 hr 47 min" })}
        episodes={episodes.slice(0, 1)}
        progress={[]}
        continueWatching={null}
        season={1}
        onSeasonChange={() => undefined}
        manualEpisode={1}
        onManualEpisodeChange={() => undefined}
      />,
    );

    assert.match(html, /Película/);
    assert.match(html, /Ver película/);
    assert.doesNotMatch(html, /Buscar número o título/);
    assert.doesNotMatch(html, /Eps 1-50/);
  });
});
