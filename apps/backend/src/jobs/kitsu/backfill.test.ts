import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { backfillKitsuIds, parseBackfillKitsuArgs, type KitsuBackfillDb } from "./backfill";

const createFakeDb = (rows: Array<{ id: number; malId: number }>) => {
  const updated: Array<{ id: number; kitsuId: string }> = [];
  const db: KitsuBackfillDb = {
    selectMissingKitsuIds: async (limit) => rows.slice(0, limit),
    updateKitsuId: async (id, kitsuId) => {
      updated.push({ id, kitsuId });
    },
  };

  return { db, updated };
};

describe("backfillKitsuIds", () => {
  it("updates found mappings and counts missing and failed rows without stopping the batch", async () => {
    const { db, updated } = createFakeDb([
      { id: 1, malId: 5114 },
      { id: 2, malId: 1 },
      { id: 3, malId: 2 },
    ]);
    const sleeps: number[] = [];

    const summary = await backfillKitsuIds({
      db,
      limit: 10,
      delayMs: 250,
      sleep: async (ms) => {
        sleeps.push(ms);
      },
      client: {
        findKitsuAnimeIdByMalId: async (malId) => {
          if (malId === 5114) return "3936";
          if (malId === 1) return null;
          throw new Error("network failed");
        },
      },
    });

    assert.deepEqual(updated, [{ id: 1, kitsuId: "3936" }]);
    assert.deepEqual(summary, { checked: 3, updated: 1, missing: 1, failed: 1 });
    assert.deepEqual(sleeps, [250, 250]);
  });
});

describe("parseBackfillKitsuArgs", () => {
  it("parses limit and delay arguments with safe defaults", () => {
    assert.deepEqual(parseBackfillKitsuArgs(["--limit", "25", "--delay-ms", "500"]), { limit: 25, delayMs: 500 });
    assert.deepEqual(parseBackfillKitsuArgs([]), { limit: 100, delayMs: 750 });
  });
});
