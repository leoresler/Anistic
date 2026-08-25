import type { NewAnime } from "@template/database";

import { computeRelevanceScore } from "./relevance";
import type { AniListMedia } from "./types";

const stripHtml = (value: string | null) => value?.replace(/<[^>]+>/g, "").trim() || null;

const toDate = (date: AniListMedia["startDate"]) => {
  if (!date?.year || !date.month || !date.day) return null;
  return new Date(Date.UTC(date.year, date.month - 1, date.day));
};

const toSeason = (season: string | null) => season?.toLowerCase() ?? null;

const toStatus = (status: string | null) => {
  if (status === "RELEASING") return "Airing";
  if (status === "FINISHED") return "Finished Airing";
  return status;
};

const findExternalId = (media: AniListMedia, site: string, pattern: RegExp) => {
  const entry = media.externalLinks.find((link) => link.site.toLowerCase() === site.toLowerCase() || pattern.test(link.url));
  return entry?.url.match(pattern)?.[1] ?? null;
};

export const mapAniListMediaToAnime = (media: AniListMedia): { anime: NewAnime; genres: string[] } => {
  if (!media.idMal) throw new Error("Cannot map AniList media without idMal");

  const averageScore = media.averageScore ?? media.meanScore;
  const anime: NewAnime = {
    id: media.idMal,
    malId: media.idMal,
    anilistId: media.id,
    title: media.title.romaji ?? media.title.english ?? media.title.native ?? `AniList ${media.id}`,
    titleEnglish: media.title.english,
    titleJapanese: media.title.native,
    synopsis: stripHtml(media.description),
    imageUrl: media.coverImage?.extraLarge ?? media.coverImage?.large ?? null,
    bannerUrl: media.bannerImage,
    trailerUrl: null,
    episodes: media.episodes,
    status: toStatus(media.status),
    score: averageScore === null || averageScore === undefined ? null : (averageScore / 10).toFixed(2),
    scoredBy: null,
    rank: null,
    popularity: media.popularity,
    anilistPopularity: media.popularity,
    trending: media.trending ?? null,
    averageScore,
    relevanceScore: computeRelevanceScore(media).toFixed(2),
    format: media.format,
    countryOfOrigin: media.countryOfOrigin,
    startDate: toDate(media.startDate),
    year: media.seasonYear ?? media.startDate?.year ?? null,
    season: toSeason(media.season),
    studio: media.studios?.nodes[0]?.name ?? null,
    rating: null,
    duration: null,
    source: media.source,
    kitsuId: findExternalId(media, "Kitsu", /anime\/(\d+)/i),
    imdbId: findExternalId(media, "IMDB", /title\/(tt\d+)/i),
    hidden: false,
    syncedAt: new Date(),
  };

  return { anime, genres: [...new Set(media.genres)] };
};
