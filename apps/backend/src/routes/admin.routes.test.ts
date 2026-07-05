import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inArray } from "drizzle-orm";
import Fastify from "fastify";
import jwt from "@fastify/jwt";

import { animes, createDb, type NewAnime } from "@template/database";

import { db, requireAdmin } from "../lib/auth";
import adminRoutes from "./admin.routes";

const testJwtSecret = "test-secret-for-admin-routes-32chars";

const baseAnime = (id: number, overrides?: Partial<NewAnime>): NewAnime => ({
  id,
  malId: id,
  title: `AdminRouteTest ${id}`,
  titleEnglish: null,
  titleJapanese: null,
  synopsis: null,
  imageUrl: null,
  trailerUrl: null,
  episodes: null,
  status: null,
  score: null,
  scoredBy: null,
  rank: null,
  popularity: null,
  year: null,
  season: null,
  studio: null,
  rating: null,
  duration: null,
  source: null,
  kitsuId: null,
  imdbId: null,
  anilistId: null,
  bannerUrl: null,
  anilistPopularity: null,
  hidden: false,
  hiddenReason: null,
  countryOfOrigin: null,
  isAdult: false,
  syncedAt: new Date("2026-01-01T00:00:00Z"),
  ...overrides,
});

const cleanupIds = async (ids: number[]) => {
  await createDb(process.env.DATABASE_URL).db.delete(animes).where(inArray(animes.id, ids));
};

const buildApp = async () => {
  const app = Fastify({ logger: false });
  await app.register(jwt, { secret: testJwtSecret });
  await app.register(adminRoutes, { prefix: "/api/admin" });
  return app;
};

describe("admin routes authentication", () => {
  it("returns 403 for non-admin on GET /api/admin/animes", async () => {
    const originalFindFirst = db.query.users.findFirst;
    db.query.users.findFirst = (async () => ({ isAdmin: false })) as typeof db.query.users.findFirst;

    const app = await buildApp();
    const token = app.jwt.sign({ sub: "user-123" });

    const response = await app.inject({
      method: "GET",
      url: "/api/admin/animes",
      headers: { Authorization: `Bearer ${token}` },
    });

    db.query.users.findFirst = originalFindFirst;

    assert.equal(response.statusCode, 403);
    assert.deepEqual(response.json(), { message: "Requiere permisos de administrador" });
  });

  it("returns 403 for non-admin on GET /api/admin/animes/stats", async () => {
    const originalFindFirst = db.query.users.findFirst;
    db.query.users.findFirst = (async () => ({ isAdmin: false })) as typeof db.query.users.findFirst;

    const app = await buildApp();
    const token = app.jwt.sign({ sub: "user-123" });

    const response = await app.inject({
      method: "GET",
      url: "/api/admin/animes/stats",
      headers: { Authorization: `Bearer ${token}` },
    });

    db.query.users.findFirst = originalFindFirst;

    assert.equal(response.statusCode, 403);
    assert.deepEqual(response.json(), { message: "Requiere permisos de administrador" });
  });
});

describe("admin routes success", () => {
  it("returns admin anime list on GET /api/admin/animes", async () => {
    const ids = [910_001, 910_002];
    await cleanupIds(ids);
    await createDb(process.env.DATABASE_URL).db.insert(animes).values([
      baseAnime(ids[0], { hidden: false }),
      baseAnime(ids[1], { hidden: true, hiddenReason: "manual" }),
    ]);

    const originalFindFirst = db.query.users.findFirst;
    db.query.users.findFirst = (async () => ({ isAdmin: true })) as typeof db.query.users.findFirst;

    const app = await buildApp();
    const token = app.jwt.sign({ sub: "admin-123" });

    try {
      const response = await app.inject({
        method: "GET",
        url: "/api/admin/animes?search=AdminRouteTest&visibility=all&sort=hidden&order=desc",
        headers: { Authorization: `Bearer ${token}` },
      });

      assert.equal(response.statusCode, 200);
      const body = response.json();
      assert.ok(Array.isArray(body.data), "data should be an array");
      assert.ok(body.pagination, "pagination should be present");
      assert.equal(typeof body.pagination.total, "number");

      const returnedIds = body.data.map((anime: { id: number }) => anime.id);
      assert.ok(returnedIds.includes(ids[0]), "visible anime should be returned");
      assert.ok(returnedIds.includes(ids[1]), "hidden anime should be returned");

      const hiddenAnime = body.data.find((anime: { id: number; hidden: boolean }) => anime.id === ids[1]);
      assert.equal(hiddenAnime?.hidden, true);
      assert.equal(hiddenAnime?.hiddenReason, "manual");
    } finally {
      db.query.users.findFirst = originalFindFirst;
      await cleanupIds(ids);
    }
  });

  it("returns admin anime stats on GET /api/admin/animes/stats", async () => {
    const ids = [910_003, 910_004];
    await cleanupIds(ids);
    await createDb(process.env.DATABASE_URL).db.insert(animes).values([
      baseAnime(ids[0], { hidden: false }),
      baseAnime(ids[1], { hidden: true, hiddenReason: "manual" }),
    ]);

    const originalFindFirst = db.query.users.findFirst;
    db.query.users.findFirst = (async () => ({ isAdmin: true })) as typeof db.query.users.findFirst;

    const app = await buildApp();
    const token = app.jwt.sign({ sub: "admin-123" });

    try {
      const response = await app.inject({
        method: "GET",
        url: "/api/admin/animes/stats",
        headers: { Authorization: `Bearer ${token}` },
      });

      assert.equal(response.statusCode, 200);
      const stats = response.json();
      assert.equal(typeof stats.total, "number");
      assert.equal(typeof stats.visible, "number");
      assert.equal(typeof stats.hidden, "number");
      assert.equal(typeof stats.hiddenByReason, "object");
      assert.ok(stats.total >= 2, "total should include test rows");
      assert.ok(stats.visible >= 1, "visible should include visible test row");
      assert.ok(stats.hidden >= 1, "hidden should include hidden test row");
      assert.ok(stats.hiddenByReason["manual"] >= 1, "manual reason should be counted");
    } finally {
      db.query.users.findFirst = originalFindFirst;
      await cleanupIds(ids);
    }
  });
});

describe("admin routes query parsing", () => {
  it("applies default values and passes query params to listAnimes", async () => {
    const ids = [910_005, 910_006];
    await cleanupIds(ids);
    await createDb(process.env.DATABASE_URL).db.insert(animes).values([
      baseAnime(ids[0], { hidden: true, hiddenReason: "filtered_out_by_sync" }),
      baseAnime(ids[1], { hidden: false }),
    ]);

    const originalFindFirst = db.query.users.findFirst;
    db.query.users.findFirst = (async () => ({ isAdmin: true })) as typeof db.query.users.findFirst;

    const app = await buildApp();
    const token = app.jwt.sign({ sub: "admin-123" });

    try {
      const response = await app.inject({
        method: "GET",
        url: "/api/admin/animes?search=AdminRouteTest&visibility=hidden&hiddenReason=filtered_out_by_sync",
        headers: { Authorization: `Bearer ${token}` },
      });

      assert.equal(response.statusCode, 200);
      const body = response.json();
      const returnedIds = body.data.map((anime: { id: number }) => anime.id);
      assert.ok(returnedIds.includes(ids[0]), "hidden anime with filtered_out_by_sync should be returned");
      assert.equal(returnedIds.includes(ids[1]), false, "visible anime should not be returned");
    } finally {
      db.query.users.findFirst = originalFindFirst;
      await cleanupIds(ids);
    }
  });
});
