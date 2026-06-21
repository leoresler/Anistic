import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { streamUsedSchema } from "@template/shared";

import { buildMagnet, extractStreams } from "./addon.routes";

const validInfoHash = "abc123def456789012345678901234567890abcd";

describe("buildMagnet", () => {
  it("builds a magnet URI from infoHash, title and trackers", () => {
    const magnet = buildMagnet(validInfoHash, "Cowboy Bebop 01", ["tracker1", "tracker2"]);
    assert.equal(
      magnet,
      "magnet:?xt=urn:btih:abc123def456789012345678901234567890abcd&dn=Cowboy+Bebop+01&tr=tracker1&tr=tracker2",
    );
  });

  it("omits tr when sources is empty", () => {
    const magnet = buildMagnet(validInfoHash, "Cowboy Bebop 01", []);
    assert.equal(magnet, "magnet:?xt=urn:btih:abc123def456789012345678901234567890abcd&dn=Cowboy+Bebop+01");
    assert.doesNotMatch(magnet, /&tr=/);
  });

  it("returns an empty string when infoHash is missing or invalid", () => {
    assert.equal(buildMagnet("", "Title", ["tracker"]), "");
    assert.equal(buildMagnet("too-short", "Title", ["tracker"]), "");
    assert.equal(buildMagnet("zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz", "Title", ["tracker"]), "");
  });

  it("encodes special characters in the title per RFC 3986", () => {
    const magnet = buildMagnet(validInfoHash, "Attack on Titan: S1 — 進撃の巨人", []);
    assert.equal(
      magnet,
      "magnet:?xt=urn:btih:abc123def456789012345678901234567890abcd&dn=Attack+on+Titan%3A+S1+%E2%80%94+%E9%80%B2%E6%92%83%E3%81%AE%E5%B7%A8%E4%BA%BA",
    );
  });

  it("falls back to Unknown when title is empty", () => {
    const magnet = buildMagnet(validInfoHash, "", []);
    assert.equal(magnet, "magnet:?xt=urn:btih:abc123def456789012345678901234567890abcd&dn=Unknown");
  });
});

describe("extractStreams", () => {
  it("extracts url streams and keeps the existing type inference", () => {
    const streams = extractStreams({ streams: [{ url: "https://host/play.m3u8", title: "Ep1" }] }, "test-addon");
    assert.equal(streams.length, 1);
    assert.equal(streams[0]?.type, "hls");
    assert.equal((streams[0] as { url: string }).url, "https://host/play.m3u8");
    assert.equal(streams[0]?.title, "Ep1");
    assert.equal(streams[0]?.addonName, "test-addon");
  });

  it("builds a torrent stream from infoHash when no url is present", () => {
    const streams = extractStreams({ streams: [{ infoHash: validInfoHash, title: "Ep1", sources: ["tr1"] }] }, "test-addon");
    assert.equal(streams.length, 1);
    assert.equal(streams[0]?.type, "torrent");
    assert.equal(
      (streams[0] as { magnet: string }).magnet,
      "magnet:?xt=urn:btih:abc123def456789012345678901234567890abcd&dn=Ep1&tr=tr1",
    );
  });

  it("prefers url over infoHash when both are present", () => {
    const streams = extractStreams(
      { streams: [{ url: "https://rd/play", infoHash: validInfoHash, title: "Ep1", sources: ["tr1"] }] },
      "test-addon",
    );
    assert.equal(streams.length, 1);
    assert.equal(streams[0]?.type, "unknown");
    assert.equal((streams[0] as { url: string }).url, "https://rd/play");
  });

  it("discards a torrent stream when infoHash is empty or invalid", () => {
    assert.equal(extractStreams({ streams: [{ infoHash: "", title: "Bad", sources: [] }] }, "test-addon").length, 0);
    assert.equal(
      extractStreams({ streams: [{ infoHash: "short", title: "Bad", sources: [] }] }, "test-addon").length,
      0,
    );
  });

  it("omits trackers from the magnet when sources is empty", () => {
    const streams = extractStreams({ streams: [{ infoHash: validInfoHash, title: "Ep1", sources: [] }] }, "test-addon");
    assert.equal(streams.length, 1);
    const magnet = (streams[0] as { magnet: string }).magnet;
    assert.doesNotMatch(magnet, /&tr=/);
  });

  it("returns an empty array for null or undefined input", () => {
    assert.deepEqual(extractStreams(null, "test-addon"), []);
    assert.deepEqual(extractStreams(undefined, "test-addon"), []);
  });

  it("preserves fileIdx in torrent metadata", () => {
    const streams = extractStreams(
      { streams: [{ infoHash: validInfoHash, title: "Ep1", sources: [], fileIdx: 0 }] },
      "test-addon",
    );
    assert.equal(streams.length, 1);
    assert.equal((streams[0] as { fileIdx?: number }).fileIdx, 0);
  });

  it("uses Unknown as display name when title is missing", () => {
    const streams = extractStreams({ streams: [{ infoHash: validInfoHash, sources: [] }] }, "test-addon");
    assert.equal(streams.length, 1);
    assert.match((streams[0] as { magnet: string }).magnet, /&dn=Unknown/);
  });
});

describe("streamUsedSchema", () => {
  it("accepts a valid magnet URI as streamUrl", () => {
    const result = streamUsedSchema.safeParse({
      malId: 1,
      season: 1,
      episode: 1,
      addonName: "torrentio",
      streamTitle: "Ep1",
      streamUrl: "magnet:?xt=urn:btih:abc123def456789012345678901234567890abcd",
    });
    assert.equal(result.success, true);
  });

  it("rejects an invalid magnet-like string", () => {
    const result = streamUsedSchema.safeParse({
      malId: 1,
      season: 1,
      episode: 1,
      addonName: "torrentio",
      streamTitle: "Ep1",
      streamUrl: "not-a-magnet",
    });
    assert.equal(result.success, false);
  });

  it("still accepts regular http urls", () => {
    const result = streamUsedSchema.safeParse({
      malId: 1,
      season: 1,
      episode: 1,
      addonName: "test",
      streamTitle: "Ep1",
      streamUrl: "https://cdn/stream.mp4",
    });
    assert.equal(result.success, true);
  });
});
