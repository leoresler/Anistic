import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { db, getAuthUserId, getOptionalAuthUserId, isAdminUser, requireAdmin, requireAuth, tryAuth } from "./auth";

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

describe("isAdminUser", () => {
  it("returns true when the JWT user is an admin", async () => {
    const originalFindFirst = db.query.users.findFirst;
    db.query.users.findFirst = (async () => ({ isAdmin: true })) as typeof db.query.users.findFirst;

    const request = { user: { sub: "admin-123" }, jwtVerify: async () => undefined };
    const result = await isAdminUser(request as never);

    db.query.users.findFirst = originalFindFirst;
    assert.equal(result, true);
  });

  it("returns false when the JWT user is not an admin", async () => {
    const originalFindFirst = db.query.users.findFirst;
    db.query.users.findFirst = (async () => ({ isAdmin: false })) as typeof db.query.users.findFirst;

    const request = { user: { sub: "user-123" }, jwtVerify: async () => undefined };
    const result = await isAdminUser(request as never);

    db.query.users.findFirst = originalFindFirst;
    assert.equal(result, false);
  });

  it("returns false when there is no JWT", async () => {
    const request = { user: undefined, jwtVerify: async () => undefined };
    const result = await isAdminUser(request as never);
    assert.equal(result, false);
  });
});

describe("requireAdmin", () => {
  it("passes through for admin users", async () => {
    const originalFindFirst = db.query.users.findFirst;
    db.query.users.findFirst = (async () => ({ isAdmin: true })) as typeof db.query.users.findFirst;

    let sent = null;
    const request = { user: { sub: "admin-123" }, jwtVerify: async () => undefined };
    const reply = {
      status: () => reply,
      send: (value: unknown) => {
        sent = value;
        return reply;
      },
      sent: false,
    };

    await requireAdmin(request as never, reply as never);

    db.query.users.findFirst = originalFindFirst;
    assert.equal(sent, null);
  });

  it("returns 403 for non-admin users", async () => {
    const originalFindFirst = db.query.users.findFirst;
    db.query.users.findFirst = (async () => ({ isAdmin: false })) as typeof db.query.users.findFirst;

    let statusCode = 0;
    let sentBody: unknown = null;
    const request = { user: { sub: "user-123" }, jwtVerify: async () => undefined };
    const reply = {
      status: (code: number) => {
        statusCode = code;
        return reply;
      },
      send: (value: unknown) => {
        sentBody = value;
        reply.sent = true;
        return reply;
      },
      sent: false,
    };

    await requireAdmin(request as never, reply as never);

    db.query.users.findFirst = originalFindFirst;
    assert.equal(statusCode, 403);
    assert.deepEqual(sentBody, { message: "Requiere permisos de administrador" });
  });
});
