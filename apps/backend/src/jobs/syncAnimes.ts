import { fileURLToPath } from "node:url";

import { eq, sql } from "drizzle-orm";

import { animeGenres, animes, createDb, type NewAnime } from "@template/database";

import {
  buildAniListQuery,
  buildAnimeUpsertSet,
  mapAniListDuration,
  mapAniListSeason,
  mapAniListSource,
  mapAniListStatus,
  stripHtml,
  type AniListFormat,
  type AniListMedium,
  type AniListPageResponse,
} from "./syncAnimes.utils";

const FORMATS: AniListFormat[] = ["TV", "MOVIE", "OVA", "ONA", "SPECIAL"];
const ALLOWED_COUNTRIES = new Set(["JP", "KR", "CN"]);
export const isAllowedCountry = (country: string | null | undefined) => ALLOWED_COUNTRIES.has(country ?? "");
const PER_PAGE = 50;
const MAX_PAGES_PER_FORMAT = 100;
const REQUEST_DELAY_MS = 700;
const BACKOFF_MS = [2000, 5000, 10000];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseLimit = (): number => {
  const match = process.argv.find((arg) => /--limit=(\d+)/.test(arg));
  return match ? Number(match.replace(/--limit=(\d+)/, "$1")) : Infinity;
};

const parseSkipCleanup = (): boolean => process.argv.includes("--skip-cleanup");

const findRanking = (rankings: AniListMedium["rankings"], type: "RATED" | "POPULAR") => {
  return rankings?.find((ranking) => ranking.type === type && ranking.allTime)?.rank ?? null;
};

export const mapAniListMediumToAnime = (media: AniListMedium): NewAnime => {
  const id = media.idMal!;

  return {
    id,
    malId: id,
    title: media.title.romaji ?? media.title.english ?? media.title.native ?? "",
    titleEnglish: media.title.english,
    titleJapanese: media.title.native,
    synopsis: stripHtml(media.description ?? ""),
    imageUrl: media.coverImage?.extraLarge ?? null,
    trailerUrl: null,
    episodes: media.episodes,
    status: mapAniListStatus(media.status),
    score: media.averageScore != null ? (media.averageScore / 10).toFixed(2) : null,
    scoredBy: null,
    rank: findRanking(media.rankings, "RATED"),
    popularity: findRanking(media.rankings, "POPULAR"),
    year: media.seasonYear ?? media.startDate?.year ?? null,
    season: mapAniListSeason(media.season),
    studio:
      media.studios?.nodes.find((studio) => studio.isAnimationStudio)?.name ??
      media.studios?.nodes[0]?.name ??
      null,
    rating: null,
    duration: mapAniListDuration(media.duration, media.format),
    source: mapAniListSource(media.source),
    kitsuId: null,
    imdbId: null,
    anilistId: media.id,
    bannerUrl: media.bannerImage,
    anilistPopularity: media.popularity,
    countryOfOrigin: media.countryOfOrigin,
    isAdult: media.isAdult,
    startDate: media.startDate
      ? new Date(Date.UTC(media.startDate.year ?? 1, (media.startDate.month ?? 1) - 1, media.startDate.day ?? 1))
      : null,
    format: media.format ?? null,
    syncedAt: new Date(),
  };
};

const fetchPage = async (
  format: AniListFormat,
  page: number,
): Promise<AniListPageResponse | null> => {
  const { query, variables } = buildAniListQuery(format, page);

  for (let attempt = 0; attempt <= BACKOFF_MS.length; attempt += 1) {
    try {
      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
      });

      if (response.status === 429) {
        if (attempt < BACKOFF_MS.length) {
          const delay = BACKOFF_MS[attempt]!;
          console.warn(`Límite de tasa en formato ${format} página ${page}: reintentando en ${delay}ms`);
          await sleep(delay);
          continue;
        }
        console.warn(`Error en formato ${format} página ${page}: límite de tasa agotado. Saltando página.`);
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return (await response.json()) as AniListPageResponse;
    } catch (error) {
      if (attempt < BACKOFF_MS.length) {
        const delay = BACKOFF_MS[attempt]!;
        console.warn(
          `Error de red en formato ${format} página ${page}: reintentando en ${delay}ms (${error instanceof Error ? error.message : "error desconocido"})`,
        );
        await sleep(delay);
        continue;
      }
      console.error(
        `Error en formato ${format} página ${page}: ${error instanceof Error ? error.message : "error desconocido"}`,
      );
      return null;
    }
  }

  return null;
};

const chunk = <T>(items: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
};

export const buildPostSyncCleanupSql = (syncStartedAt: Date) => sql`
  UPDATE ${animes}
  SET hidden = true, hidden_reason = 'filtered_out_by_sync'
  WHERE ${animes.syncedAt} < ${syncStartedAt} AND hidden = false
`;

type RelevanceScoreInput = {
  score: string | null;
  year: number | null;
  status: string | null;
  popPercentile: number;
  currentYear: number;
};

export const calculateRelevanceScore = ({
  score,
  year,
  status,
  popPercentile,
  currentYear,
}: RelevanceScoreInput): number => {
  const scoreTerm = (Number(score ?? 0) / 10) * 0.30;
  const popTerm = popPercentile * 0.40;
  const recencyTerm =
    year == null ? 0 : Math.max(0, (year - 1990) / (currentYear - 1990)) * 0.15;
  const statusMultiplier =
    status === "Airing" ? 1.0 : status === "Finished Airing" ? 0.6 : status === "Not yet aired" ? 0.1 : 0.3;
  const statusTerm = statusMultiplier * 0.15;

  return (scoreTerm + popTerm + recencyTerm + statusTerm) * 100;
};

export const buildRelevanceUpdateSql = () => sql`
  UPDATE ${animes} SET "relevance_score" = (
    (COALESCE(${animes.score}, 0) / 10.0 * 0.30) +
    (pp.pop_percentile * 0.40) +
    (CASE WHEN ${animes.year} IS NULL THEN 0 ELSE GREATEST(0, (${animes.year} - 1990)::float / (EXTRACT(year FROM now()) - 1990)) END * 0.15) +
    (CASE ${animes.status}
      WHEN 'Airing' THEN 1.0
      WHEN 'Finished Airing' THEN 0.6
      WHEN 'Not yet aired' THEN 0.1
      ELSE 0.3
    END * 0.15)
  ) * 100
  FROM (
    SELECT ${animes.id} AS id, PERCENT_RANK() OVER (ORDER BY ${animes.anilistPopularity} DESC NULLS LAST) AS pop_percentile
    FROM ${animes}
    WHERE ${animes.hidden} = false
  ) pp
  WHERE ${animes.id} = pp.id
`;

const main = async () => {
  const { db, pool } = createDb(process.env.DATABASE_URL);
  const limit = parseLimit();
  const skipCleanup = parseSkipCleanup();
  const syncStartedAt = new Date();
  let totalUpserted = 0;
  let totalSkipped = 0;
  let totalSkippedCountry = 0;
  let totalErrors = 0;
  let hadErrors = false;

  console.log(Number.isFinite(limit) ? `Límite: ${limit} páginas por formato` : "Límite: sin límite");

  try {
    for (const format of FORMATS) {
      let formatUpserted = 0;
      let formatSkipped = 0;
      let formatSkippedCountry = 0;
      let page = 1;

      while (true) {
        const response = await fetchPage(format, page);
        let hasNextPage = false;

        if (response === null) {
          hadErrors = true;
          totalErrors += 1;
        } else {
          const pageInfo = response.data.Page.pageInfo;
          hasNextPage = pageInfo.hasNextPage;
          const totalPages = Math.ceil(pageInfo.total / PER_PAGE);
          console.log(`Sincronizando formato ${format} - página ${page}/${totalPages || "?"}`);

          const idMalMedia = response.data.Page.media.filter((media) => media.idMal !== null);
          const skippedOnPage = response.data.Page.media.length - idMalMedia.length;
          formatSkipped += skippedOnPage;
          totalSkipped += skippedOnPage;

          const validMedia = idMalMedia.filter((media) => {
            if (!isAllowedCountry(media.countryOfOrigin)) {
              formatSkippedCountry += 1;
              totalSkippedCountry += 1;
              console.log(`Saltando anime ${media.id} — país de origen: ${media.countryOfOrigin}`);
              return false;
            }
            return true;
          });

          const batches = chunk(validMedia, 100);

          for (const batch of batches) {
            try {
              for (const media of batch) {
                const record = mapAniListMediumToAnime(media);

                await db
                  .insert(animes)
                  .values(record)
                  .onConflictDoUpdate({
                    target: animes.id,
                    set: buildAnimeUpsertSet(record),
                  });

                const EXCLUDED_GENRES = new Set(["Hentai"]);
                const genres = [...new Set(media.genres ?? [])].filter((g) => Boolean(g) && !EXCLUDED_GENRES.has(g)) as string[];
                try {
                  await db.delete(animeGenres).where(eq(animeGenres.animeId, record.id));
                  if (genres.length > 0) {
                    await db
                      .insert(animeGenres)
                      .values(genres.map((genre) => ({ animeId: record.id, genre })));
                  }
                } catch (error) {
                  hadErrors = true;
                  console.warn(
                    `Error al sincronizar géneros para anime ${record.id}: ${error instanceof Error ? error.message : "error desconocido"}`,
                  );
                }
              }

              formatUpserted += batch.length;
              totalUpserted += batch.length;
            } catch (error) {
              hadErrors = true;
              totalErrors += 1;
              console.error(
                `Error al insertar lote en formato ${format} página ${page}: ${error instanceof Error ? error.message : "error desconocido"}`,
              );
            }
          }
        }

        if (!hasNextPage || page >= MAX_PAGES_PER_FORMAT || (Number.isFinite(limit) && page >= limit)) {
          break;
        }

        await sleep(REQUEST_DELAY_MS);
        page += 1;
      }

      console.log(`Formato ${format} completo: ${formatUpserted} sincronizados, ${formatSkipped} omitidos (idMal=null), ${formatSkippedCountry} omitidos por país`);
    }

    if (totalUpserted === 0) {
      console.warn("Sincronización falló (0 animes subidos). Saltando limpieza post-sync y relevance score para no ocultar el catálogo existente.");
    } else {
      if (!skipCleanup) {
        try {
          const result = await db.execute(buildPostSyncCleanupSql(syncStartedAt));
          console.log(`Limpieza post-sync: ${result.rowCount} animes marcados como ocultos (no matchearon los filtros nuevos)`);
        } catch (error) {
          console.warn(
            `Limpieza post-sync falló: ${error instanceof Error ? error.message : "error desconocido"}`,
          );
        }
      }

      try {
        console.log("Calculando relevance score...");
        const relevanceResult = await db.execute(buildRelevanceUpdateSql());
        console.log(`Relevance score calculado para ${relevanceResult.rowCount ?? 0} animes`);
      } catch (error) {
        console.warn(
          `Cálculo de relevance score falló: ${error instanceof Error ? error.message : "error desconocido"}`,
        );
      }
    }
  } finally {
    await pool.end();
  }

  console.log(
    `Sincronización completa: ${totalUpserted} subidos, ${totalSkipped} omitidos (idMal=null), ${totalSkippedCountry} omitidos por país, ${totalErrors} páginas con error`,
  );

  process.exit(hadErrors ? 1 : 0);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
