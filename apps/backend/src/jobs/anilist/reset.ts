import { sql, type SQLWrapper } from "drizzle-orm";

import { animeEpisodes, animeGenres, animes, animeUserEvents, userAnimeLists, userAnimeProgress, userStreamHistory } from "@template/database";

type ResetSafetyInput = { nodeEnv?: string; databaseUrl?: string };

export const assertSafeCatalogReset = ({ nodeEnv = process.env.NODE_ENV, databaseUrl = process.env.DATABASE_URL }: ResetSafetyInput) => {
  if (nodeEnv === "production") throw new Error("Catalog reset is not allowed in production");
  if (!databaseUrl) throw new Error("Catalog reset requires DATABASE_URL");

  const url = new URL(databaseUrl);
  const localHost = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (!localHost) throw new Error("Catalog reset is only allowed for local/dev database targets");
};

export const resetAnimeCatalog = async (db: { execute: (query: string | SQLWrapper) => Promise<unknown> }, input: ResetSafetyInput = {}) => {
  assertSafeCatalogReset(input);
  await db.execute(sql`
    truncate table ${animeUserEvents}, ${userStreamHistory}, ${userAnimeProgress}, ${userAnimeLists}, ${animeEpisodes}, ${animeGenres}, ${animes}
    restart identity cascade
  `);
};
