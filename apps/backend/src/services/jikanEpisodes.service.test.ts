import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isCacheValid,
  mapJikanEpisodeToAnimeEpisode,
  parseJikanEpisodesResponse,
  parseJikanPagination,
  type JikanEpisode,
  type JikanEpisodesResponse,
} from "./jikanEpisodes.service";

describe("parseJikanPagination", () => {
  it("extracts pagination fields", () => {
    const raw: JikanEpisodesResponse = {
      pagination: { last_visible_page: 12, has_next_page: true, current_page: 1 },
      data: [],
    };
    const result = parseJikanPagination(raw);
    assert.equal(result.lastVisiblePage, 12);
    assert.equal(result.hasNextPage, true);
    assert.equal(result.currentPage, 1);
  });

  it("defaults to page 1 when pagination is missing", () => {
    const raw = { data: [] } as unknown as JikanEpisodesResponse;
    const result = parseJikanPagination(raw);
    assert.equal(result.lastVisiblePage, 1);
    assert.equal(result.hasNextPage, false);
    assert.equal(result.currentPage, 1);
  });

  it("treats last_visible_page 0 as 1", () => {
    const raw: JikanEpisodesResponse = {
      pagination: { last_visible_page: 0, has_next_page: false },
      data: [],
    };
    const result = parseJikanPagination(raw);
    assert.equal(result.lastVisiblePage, 1);
  });
});

describe("mapJikanEpisodeToAnimeEpisode", () => {
  const cachedAt = new Date("2026-06-21T12:00:00.000Z");

  it("maps all provided fields", () => {
    const jikanEp: JikanEpisode = {
      mal_id: 780,
      title: "A Dark and Quiet Place",
      title_japanese: "暗く静かな場所",
      aired: "2017-03-26T00:00:00+00:00",
      score: 6.5,
      filler: true,
      recap: false,
    };
    const result = mapJikanEpisodeToAnimeEpisode(jikanEp, 21, cachedAt);
    assert.equal(result.animeId, 21);
    assert.equal(result.season, 1);
    assert.equal(result.episode, 780);
    assert.equal(result.title, "A Dark and Quiet Place");
    assert.equal(result.titleJapanese, "暗く静かな場所");
    assert.equal(result.thumbnailUrl, null);
    assert.equal(result.airedAt, "2017-03-26T00:00:00.000Z");
    assert.equal(result.createdAt, cachedAt.toISOString());
    assert.equal(result.filler, true);
    assert.equal(result.recap, false);
    assert.equal(result.score, 6.5);
  });

  it("uses defaults for missing optional fields", () => {
    const jikanEp: JikanEpisode = {
      mal_id: 1,
      title: "Asteroid Blues",
    };
    const result = mapJikanEpisodeToAnimeEpisode(jikanEp, 1, cachedAt);
    assert.equal(result.titleJapanese, null);
    assert.equal(result.airedAt, null);
    assert.equal(result.score, null);
    assert.equal(result.filler, false);
    assert.equal(result.recap, false);
  });
});

describe("parseJikanEpisodesResponse", () => {
  const cachedAt = new Date("2026-06-21T12:00:00.000Z");

  it("returns an empty array when data is empty", () => {
    const raw: JikanEpisodesResponse = {
      pagination: { last_visible_page: 1, has_next_page: false },
      data: [],
    };
    const result = parseJikanEpisodesResponse(raw, 1, cachedAt);
    assert.equal(result.length, 0);
  });

  it("maps multiple episodes", () => {
    const raw: JikanEpisodesResponse = {
      pagination: { last_visible_page: 1, has_next_page: false },
      data: [
        { mal_id: 1, title: "Asteroid Blues" },
        { mal_id: 2, title: "Stray Dog Strut" },
      ],
    };
    const result = parseJikanEpisodesResponse(raw, 1, cachedAt);
    assert.equal(result.length, 2);
    assert.equal(result[0].episode, 1);
    assert.equal(result[1].episode, 2);
  });

  it("returns an empty array when data is null or undefined", () => {
    const rawNull = { pagination: { last_visible_page: 1, has_next_page: false }, data: null } as unknown as JikanEpisodesResponse;
    const rawUndefined = { pagination: { last_visible_page: 1, has_next_page: false } } as unknown as JikanEpisodesResponse;
    assert.equal(parseJikanEpisodesResponse(rawNull, 1, cachedAt).length, 0);
    assert.equal(parseJikanEpisodesResponse(rawUndefined, 1, cachedAt).length, 0);
  });
});

describe("isCacheValid", () => {
  const ttlMs = 7 * 24 * 60 * 60 * 1000;

  it("returns true for a fresh cache", () => {
    const cachedAt = new Date(Date.now() - ttlMs + 1);
    assert.equal(isCacheValid(cachedAt, ttlMs), true);
  });

  it("returns false at the exact TTL boundary", () => {
    const cachedAt = new Date(Date.now() - ttlMs);
    assert.equal(isCacheValid(cachedAt, ttlMs), false);
  });

  it("returns false for an expired cache", () => {
    const cachedAt = new Date(Date.now() - ttlMs - 1);
    assert.equal(isCacheValid(cachedAt, ttlMs), false);
  });
});
