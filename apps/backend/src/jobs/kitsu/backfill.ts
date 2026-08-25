import { pathToFileURL } from "node:url";

import { asc, eq, isNull } from "drizzle-orm";

import { animes, createDb } from "@template/database";

import { createKitsuMappingClient, type KitsuMappingClient } from "./client";

export type KitsuBackfillSummary = { checked: number; updated: number; missing: number; failed: number };

export type KitsuBackfillDb = {
  selectMissingKitsuIds: (limit: number) => Promise<Array<{ id: number; malId: number }>>;
  updateKitsuId: (id: number, kitsuId: string) => Promise<void>;
};

type BackfillKitsuIdsOptions = {
  db: KitsuBackfillDb;
  client?: KitsuMappingClient;
  limit?: number;
  delayMs?: number;
  sleep?: (ms: number) => Promise<void>;
};

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const parseBackfillKitsuArgs = (args: string[]) => {
  const getNumberArg = (name: string, fallback: number) => {
    const index = args.indexOf(name);
    const value = index >= 0 ? Number(args[index + 1]) : fallback;
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
  };

  return {
    limit: getNumberArg("--limit", 100),
    delayMs: getNumberArg("--delay-ms", 750),
  };
};

export const backfillKitsuIds = async ({ db, client = createKitsuMappingClient(), limit = 100, delayMs = 750, sleep = defaultSleep }: BackfillKitsuIdsOptions): Promise<KitsuBackfillSummary> => {
  const rows = await db.selectMissingKitsuIds(limit);
  const summary: KitsuBackfillSummary = { checked: 0, updated: 0, missing: 0, failed: 0 };

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    summary.checked += 1;

    try {
      const kitsuId = await client.findKitsuAnimeIdByMalId(row.malId);
      if (kitsuId) {
        await db.updateKitsuId(row.id, kitsuId);
        summary.updated += 1;
      } else {
        summary.missing += 1;
      }
    } catch {
      summary.failed += 1;
    }

    if (delayMs > 0 && index < rows.length - 1) await sleep(delayMs);
  }

  return summary;
};

export const createDrizzleKitsuBackfillDb = (db: ReturnType<typeof createDb>["db"]): KitsuBackfillDb => ({
  selectMissingKitsuIds: async (limit) => db.select({ id: animes.id, malId: animes.malId }).from(animes).where(isNull(animes.kitsuId)).orderBy(asc(animes.id)).limit(limit),
  updateKitsuId: async (id, kitsuId) => {
    await db.update(animes).set({ kitsuId }).where(eq(animes.id, id));
  },
});

export const runKitsuIdBackfill = async (args = process.argv.slice(2)) => {
  const options = parseBackfillKitsuArgs(args);
  const { db, pool } = createDb(process.env.DATABASE_URL);

  try {
    return await backfillKitsuIds({ db: createDrizzleKitsuBackfillDb(db), ...options });
  } finally {
    await pool.end();
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const summary = await runKitsuIdBackfill();
  console.log("Kitsu ID backfill complete:", summary);
}
