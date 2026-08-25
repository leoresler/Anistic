import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildEpisodeRanges,
  filterEpisodesByQuery,
  filterEpisodesByRange,
  formatAnimeFormatLabel,
  formatEpisodeCountLabel,
  getDefaultEpisodeRangeStart,
  getEpisodeRowCtaLabel,
  getPrimaryWatchCtaLabel,
} from "./animeLabels";

describe("anime label helpers", () => {
  it("localizes known AniList formats", () => {
    assert.equal(formatAnimeFormatLabel("TV"), "Serie");
    assert.equal(formatAnimeFormatLabel("MOVIE"), "Película");
    assert.equal(formatAnimeFormatLabel("SPECIAL"), "Especial");
    assert.equal(formatAnimeFormatLabel(null), "Anime");
  });

  it("uses movie-aware episode labels instead of awkward 1 eps copy", () => {
    assert.equal(formatEpisodeCountLabel("MOVIE", 1), "Película");
    assert.equal(formatEpisodeCountLabel("TV", 1), "1 episodio");
    assert.equal(formatEpisodeCountLabel("TV", 24), "24 episodios");
    assert.equal(formatEpisodeCountLabel("OVA", null), "Episodios por confirmar");
  });

  it("keeps movie CTAs movie-specific even if progress exists", () => {
    assert.equal(getPrimaryWatchCtaLabel({ format: "MOVIE", continueEpisode: 1 }), "Ver película");
    assert.equal(getPrimaryWatchCtaLabel({ format: "TV", continueEpisode: 432 }), "Continuar episodio 432");
    assert.equal(getPrimaryWatchCtaLabel({ format: "TV" }), "Ver episodio 1");
  });

  it("labels episode rows by watched/progress state", () => {
    assert.equal(getEpisodeRowCtaLabel(true, 10), "Ver de nuevo");
    assert.equal(getEpisodeRowCtaLabel(false, 720), "Continuar");
    assert.equal(getEpisodeRowCtaLabel(false, 0), "Ver episodio");
  });
});

describe("episode navigation helpers", () => {
  const episodes = Array.from({ length: 121 }, (_, index) => ({ episode: index + 1, title: `Episode ${index + 1}` }));

  it("builds 50-episode range windows for long-running anime", () => {
    assert.deepEqual(buildEpisodeRanges(episodes), [
      { start: 1, end: 50 },
      { start: 51, end: 100 },
      { start: 101, end: 121 },
    ]);
  });

  it("defaults to the continue-watching range when available", () => {
    const ranges = buildEpisodeRanges(episodes);
    assert.equal(getDefaultEpisodeRangeStart(ranges, 107), 101);
    assert.equal(getDefaultEpisodeRangeStart(ranges, null), 1);
  });

  it("filters episodes by number or title", () => {
    assert.deepEqual(filterEpisodesByQuery(episodes, "107").map((episode) => episode.episode), [107]);
    assert.deepEqual(filterEpisodesByQuery([{ episode: 1, title: "Romance Dawn" }], "dawn").map((episode) => episode.episode), [1]);
  });

  it("filters visible episodes by a manually selected range", () => {
    assert.deepEqual(filterEpisodesByRange(episodes, { start: 51, end: 100 }).map((episode) => episode.episode),
      Array.from({ length: 50 }, (_, index) => index + 51),
    );
  });
});
