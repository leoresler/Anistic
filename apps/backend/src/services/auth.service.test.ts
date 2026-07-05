import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { User } from "@template/database";

import { env } from "../env";
import { db, ensureAdminFlag, getUserById } from "./auth.service";

describe("ensureAdminFlag", () => {
  it("promotes the user when email matches ADMIN_EMAIL", async () => {
    env.ADMIN_EMAIL = "admin@example.com";

    let capturedUpdate: { table: unknown; values: unknown; where: unknown } | null = null;
    const originalUpdate = db.update;
    db.update = ((table: unknown) => ({
      set: (values: unknown) => ({
        where: (where: unknown) => {
          capturedUpdate = { table, values, where };
          return Promise.resolve([]);
        },
      }),
    })) as unknown as typeof db.update;

    const promoted = await ensureAdminFlag("user-123", "admin@example.com");

    db.update = originalUpdate;

    assert.equal(promoted, true);
    assert.ok(capturedUpdate, "update should have been called");
    assert.deepEqual((capturedUpdate as { values: unknown }).values, { isAdmin: true });
  });

  it("is a no-op when email does not match ADMIN_EMAIL", async () => {
    env.ADMIN_EMAIL = "admin@example.com";

    let updateCalled = false;
    const originalUpdate = db.update;
    db.update = (() => {
      updateCalled = true;
      return { set: () => ({ where: () => Promise.resolve([]) }) };
    }) as unknown as typeof db.update;

    const promoted = await ensureAdminFlag("user-123", "other@example.com");

    db.update = originalUpdate;

    assert.equal(promoted, false);
    assert.equal(updateCalled, false);
  });

  it("is a no-op when ADMIN_EMAIL is not set", async () => {
    env.ADMIN_EMAIL = undefined;

    let updateCalled = false;
    const originalUpdate = db.update;
    db.update = (() => {
      updateCalled = true;
      return { set: () => ({ where: () => Promise.resolve([]) }) };
    }) as unknown as typeof db.update;

    const promoted = await ensureAdminFlag("user-123", "admin@example.com");

    db.update = originalUpdate;

    assert.equal(promoted, false);
    assert.equal(updateCalled, false);
  });
});

describe("publicUser mapping", () => {
  it("includes isAdmin in the returned auth user", async () => {
    const fakeUser: User = {
      id: "user-123",
      email: "test@example.com",
      phone: null,
      password: null,
      googleId: null,
      name: "Test",
      avatarUrl: null,
      isAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Use getUserById's publicUser mapping by mocking the DB lookup.
    const originalFindFirst = db.query.users.findFirst;
    db.query.users.findFirst = (async () => fakeUser) as typeof db.query.users.findFirst;

    const publicUser = await getUserById("user-123");

    db.query.users.findFirst = originalFindFirst;

    assert.ok(publicUser);
    assert.equal(publicUser?.isAdmin, true);
  });
});
