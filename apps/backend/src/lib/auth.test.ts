import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getAuthUserId, getOptionalAuthUserId, requireAuth, tryAuth } from "./auth";

describe("auth route helpers", () => {
  it("stores the JWT subject for authenticated route handlers", async () => {
    const request = {
      user: undefined as unknown,
      jwtVerify: async () => {
        request.user = { sub: "user-123" };
      },
    };
    const reply = { status: () => ({ send: () => undefined }) };

    await requireAuth(request as never, reply as never);

    assert.equal(getAuthUserId(request as never), "user-123");
    assert.equal(getOptionalAuthUserId(request as never), "user-123");
  });

  it("keeps optional auth anonymous when verification fails", async () => {
    const request = {
      user: undefined as unknown,
      jwtVerify: async () => {
        throw new Error("invalid token");
      },
    };

    await tryAuth(request as never);

    assert.equal(getOptionalAuthUserId(request as never), null);
  });
});
