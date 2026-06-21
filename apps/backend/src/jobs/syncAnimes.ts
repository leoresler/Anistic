import { readFileSync } from "node:fs";

import { eq, sql } from "drizzle-orm";

import { animeEpisodes, animeGenres, animes, createDb, type NewAnime } from "@template/database";

import { buildAnimeUpsertSet } from "./syncAnimes.utils";

const TOTAL_PAGES = 20;
const LIMIT = 25;
const REQUEST_DELAY_MS = 400;

type JikanAnime = {
  mal_id: number;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  synopsis: string | null;
  images?: { jpg?: { large_image_url?: string | null } };
  trailer?: { url?: string | null };
  episodes: number | null;
  status: string | null;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  year: number | null;
  season: string | null;
  studios?: Array<{ name: string }>;
  rating: string | null;
  duration: string | null;
  source: string | null;
  genres?: Array<{ name: string }>;
  external?: Array<{ name?: string; url?: string }>;
};

type JikanResponse = { data?: JikanAnime[] };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const loadMalKitsuMapping = (): Map<string, string> | undefined => {
  try {
    const raw = readFileSync(new URL("../../../../data/mal-kitsu-mapping.json", import.meta.url), "utf-8");
    const parsed = JSON.parse(raw) as Record<string, string>;
    const map = new Map<string, string>();
    for (const [malId, kitsuId] of Object.entries(parsed)) {
      if (/^\d+$/.test(malId)) map.set(malId, kitsuId);
    }
    return map;
  } catch (error) {
    console.warn("No se pudo cargar el mapeo MAL→Kitsu:", error instanceof Error ? error.message : error);
    return undefined;
  }
};

const findExternalId = (anime: JikanAnime, provider: "kitsu" | "imdb") => {
  const external = anime.external?.find((entry) => entry.name?.toLowerCase() === provider || entry.url?.includes(provider));
  if (!external?.url) return null;

  if (provider === "kitsu") {
    return external.url.match(/anime\/(\d+)/i)?.[1] ?? null;
  }

  return external.url.match(/title\/(tt\d+)/i)?.[1] ?? null;
};

const toAnimeRecord = (anime: JikanAnime, malKitsuMap?: Map<string, string>): NewAnime => {
  const externalKitsuId = findExternalId(anime, "kitsu");
  const mappedKitsuId = !externalKitsuId && malKitsuMap ? malKitsuMap.get(String(anime.mal_id)) ?? null : null;

  return {
    id: anime.mal_id,
    malId: anime.mal_id,
    title: anime.title,
    titleEnglish: anime.title_english,
    titleJapanese: anime.title_japanese,
    synopsis: anime.synopsis,
    imageUrl: anime.images?.jpg?.large_image_url ?? null,
    trailerUrl: anime.trailer?.url ?? null,
    episodes: anime.episodes,
    status: anime.status,
    score: anime.score === null ? null : anime.score.toFixed(2),
    scoredBy: anime.scored_by,
    rank: anime.rank,
    popularity: anime.popularity,
    year: anime.year,
    season: anime.season,
    studio: anime.studios?.[0]?.name ?? null,
    rating: anime.rating,
    duration: anime.duration,
    source: anime.source,
    kitsuId: externalKitsuId || mappedKitsuId,
    imdbId: findExternalId(anime, "imdb"),
    syncedAt: new Date(),
  };
};

const main = async () => {
  const { db, pool } = createDb(process.env.DATABASE_URL);
  const malKitsuMap = loadMalKitsuMapping();
  let totalUpserted = 0;
  let totalSkipped = 0;

  try {
    for (let page = 1; page <= TOTAL_PAGES; page += 1) {
      try {
        process.stdout.write(`Syncing page ${page}/${TOTAL_PAGES}... `);
        const response = await fetch(`https://api.jikan.moe/v4/top/anime?limit=${LIMIT}&page=${page}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const body = (await response.json()) as JikanResponse;
        const pageAnimes = body.data ?? [];

        for (const anime of pageAnimes) {
          const record = toAnimeRecord(anime, malKitsuMap);
          await db
            .insert(animes)
            .values(record)
            .onConflictDoUpdate({
              target: animes.id,
              set: buildAnimeUpsertSet(record),
            });

          await db.delete(animeGenres).where(eq(animeGenres.animeId, anime.mal_id));

          const genres = [...new Set((anime.genres ?? []).map((genre) => genre.name).filter(Boolean))];
          if (genres.length > 0) {
            await db.insert(animeGenres).values(genres.map((genre) => ({ animeId: anime.mal_id, genre })));
          }

          if (anime.episodes && anime.episodes > 0) {
            await db.execute(sql`
              insert into ${animeEpisodes} (anime_id, season, episode, title)
              select ${anime.mal_id}, 1, generated_episode, 'Episodio ' || generated_episode
              from generate_series(1, ${anime.episodes}) generated_episode
              on conflict (anime_id, season, episode) do nothing
            `);
          }
        }

        totalUpserted += pageAnimes.length;
        console.log(`done (${pageAnimes.length} animes upserted)`);
      } catch (error) {
        totalSkipped += LIMIT;
        console.error(`failed (${error instanceof Error ? error.message : "error desconocido"})`);
      }

      if (page < TOTAL_PAGES) {
        await sleep(REQUEST_DELAY_MS);
      }
    }
  } finally {
    await pool.end();
  }

  console.log(`Anime sync complete: ${totalUpserted} upserted, ${totalSkipped} skipped`);
};

await main();
