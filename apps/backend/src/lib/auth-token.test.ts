import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { extractBearerToken } from "./auth-token";

describe("extractBearerToken", () => {
  it("returns the token from a Bearer authorization header", () => {
    assert.equal(extractBearerToken("Bearer abc.def.ghi"), "abc.def.ghi");
  });

  it("returns null when authorization is missing or not a Bearer token", () => {
    assert.equal(extractBearerToken(undefined), null);
    assert.equal(extractBearerToken("Basic abc.def.ghi"), null);
  });
});
