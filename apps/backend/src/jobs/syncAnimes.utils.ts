import { sql } from "drizzle-orm";

import { animes, type NewAnime } from "@template/database";

export const buildAnimeUpsertSet = (record: NewAnime) => ({
  ...record,
  kitsuId: record.kitsuId ?? sql`${animes.kitsuId}`,
  imdbId: record.imdbId ?? sql`${animes.imdbId}`,
});
