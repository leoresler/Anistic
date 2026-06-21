import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildStreamUrl,
  createErrorResponse,
  isPlayableFile,
  parseInfoHashFromPath,
  selectPlayableFile,
} from "./torrent-server";

describe("parseInfoHashFromPath", () => {
  it("returns the infoHash from a stream path", () => {
    assert.equal(parseInfoHashFromPath("/abc123def456abc123def456abc123def456abcd/stream"), "abc123def456abc123def456abc123def456abcd");
  });

  it("returns null for malformed paths", () => {
    assert.equal(parseInfoHashFromPath("/"), null);
    assert.equal(parseInfoHashFromPath("/short/stream"), null);
    assert.equal(parseInfoHashFromPath("/abc123def456abc123def456abc123def456abcde/stream/extra"), null);
    assert.equal(parseInfoHashFromPath(""), null);
  });
});

describe("isPlayableFile", () => {
  it("returns true for known video extensions", () => {
    assert.equal(isPlayableFile({ name: "movie.mp4" }), true);
    assert.equal(isPlayableFile({ name: "movie.mkv" }), true);
    assert.equal(isPlayableFile({ name: "movie.webm" }), true);
    assert.equal(isPlayableFile({ name: "movie.avi" }), true);
    assert.equal(isPlayableFile({ name: "movie.mov" }), true);
  });

  it("returns false for non-media files", () => {
    assert.equal(isPlayableFile({ name: "readme.txt" }), false);
    assert.equal(isPlayableFile({ name: "cover.jpg" }), false);
    assert.equal(isPlayableFile({ name: "subs.srt" }), false);
    assert.equal(isPlayableFile({ name: "no-extension" }), false);
  });
});

describe("selectPlayableFile", () => {
  it("selects the first playable file", () => {
    const files = [{ name: "readme.txt" }, { name: "video.mp4" }, { name: "bonus.mkv" }];
    assert.equal(selectPlayableFile(files)?.name, "video.mp4");
  });

  it("returns null when no file is playable", () => {
    assert.equal(selectPlayableFile([{ name: "readme.txt" }, { name: "cover.jpg" }]), null);
  });

  it("returns null for an empty list", () => {
    assert.equal(selectPlayableFile([]), null);
  });
});

describe("buildStreamUrl", () => {
  it("builds a localhost stream URL", () => {
    assert.equal(buildStreamUrl(13333, "abc123"), "http://localhost:13333/abc123/stream");
  });
});

describe("createErrorResponse", () => {
  it("returns an error object", () => {
    assert.deepEqual(createErrorResponse("torrent not found"), { error: "torrent not found" });
  });
});
