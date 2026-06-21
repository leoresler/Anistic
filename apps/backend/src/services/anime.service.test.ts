import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { animes } from "@template/database";

import { animePayload } from "./anime.service";

describe("animePayload", () => {
  it("includes the kitsuId column", () => {
    assert.ok("kitsuId" in animePayload, "kitsuId should be present in animePayload");
    assert.equal(animePayload.kitsuId, animes.kitsuId);
  });

  it("preserves existing fields", () => {
    assert.equal(animePayload.id, animes.id);
    assert.equal(animePayload.title, animes.title);
    assert.equal(animePayload.malId, animes.malId);
  });
});
