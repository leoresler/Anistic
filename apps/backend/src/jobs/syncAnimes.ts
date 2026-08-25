import { pathToFileURL } from "node:url";

import { eq, sql } from "drizzle-orm";

import { animeEpisodes, animeGenres, animes, createDb } from "@template/database";

import { createAniListClient, fetchAniListCatalog } from "./anilist/client";
import { filterAniListMedia } from "./anilist/filters";
import { mapAniListMediaToAnime } from "./anilist/mapper";
import { computeRelevanceScore } from "./anilist/relevance";
import { resetAnimeCatalog } from "./anilist/reset";
import { createDiscardCounts, type AniListMedia } from "./anilist/types";
import { buildAnimeUpsertSet } from "./syncAnimes.utils";

type SyncOptions = { reset?: boolean; media?: AniListMedia[] };

const MAX_CATALOG_SIZE = 6_000;

export const dedupeMedia = (media: AniListMedia[]) => {
  const byMal = new Map<number, AniListMedia>();
  const malByAniList = new Map<number, number>();

  const relevance = (item: AniListMedia) => computeRelevanceScore(item);
  const mergeGenres = (left: string[], right: string[]) => [...new Set([...left, ...right])];

  for (const item of media) {
    if (!item.idMal) continue;
    const malKey = malByAniList.get(item.id) ?? item.idMal;
    const existing = byMal.get(malKey);

    if (!existing) {
      byMal.set(malKey, item);
      malByAniList.set(item.id, malKey);
      continue;
    }

    const genres = mergeGenres(existing.genres, item.genres);
    const stronger = relevance(item) > relevance(existing) ? item : existing;
    byMal.set(malKey, { ...stronger, genres });
    malByAniList.set(item.id, malKey);
  }

  return [...byMal.values()];
};

export const selectCatalogMedia = (media: AniListMedia[], maxCatalogSize = MAX_CATALOG_SIZE) => {
  const discards = createDiscardCounts();
  const selected = dedupeMedia(media)
    .filter((item) => {
      const filter = filterAniListMedia(item);
      if (!filter.keep) {
        discards[filter.reason] += 1;
        return false;
      }

      return true;
    })
    .sort((left, right) => computeRelevanceScore(right) - computeRelevanceScore(left))
    .slice(0, maxCatalogSize);

  return { selected, discards };
};

export const runAnilistCatalogSync = async ({ reset = process.argv.includes("--reset"), media }: SyncOptions = {}) => {
  const { db, pool } = createDb(process.env.DATABASE_URL);
  let totalUpserted = 0;

  try {
    if (reset) await resetAnimeCatalog(db, { nodeEnv: process.env.NODE_ENV, databaseUrl: process.env.DATABASE_URL });

    const fetched = media
      ? { media, skippedPages: [] }
      : await fetchAniListCatalog(createAniListClient({ retries: 4, delayMs: 2_500 }), undefined, {
        delayBetweenPagesMs: 900,
        maxPagesPerLane: 40,
      });
    const { selected, discards } = selectCatalogMedia(fetched.media);
    for (const item of selected) {
      const { anime, genres } = mapAniListMediaToAnime(item);
      await db
        .insert(animes)
        .values(anime)
        .onConflictDoUpdate({
          target: animes.id,
          set: buildAnimeUpsertSet(anime),
        });

      await db.delete(animeGenres).where(eq(animeGenres.animeId, anime.id));
      if (genres.length > 0) {
        await db.insert(animeGenres).values(genres.map((genre) => ({ animeId: anime.id, genre })));
      }

      if (anime.episodes && anime.episodes > 0) {
        await db.execute(sql`
          insert into ${animeEpisodes} (anime_id, season, episode, title)
          select ${anime.id}, 1, generated_episode, 'Episodio ' || generated_episode
          from generate_series(1, ${anime.episodes}) generated_episode
          on conflict (anime_id, season, episode) do nothing
        `);
      }

      totalUpserted += 1;
    }

    return { totalUpserted, discards, skippedPages: fetched.skippedPages };
  } finally {
    await pool.end();
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const summary = await runAnilistCatalogSync();
  console.log("Anime sync complete:", summary);
}
