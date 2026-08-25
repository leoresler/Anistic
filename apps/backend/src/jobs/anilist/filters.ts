import type { AniListMedia, DiscardReason } from "./types";

const allowedFormats = new Set(["TV", "MOVIE", "ONA", "OVA", "SPECIAL"]);
const blockedGenres = new Set(["hentai", "erotica", "boys love", "girls love", "kids", "music", "avant garde"]);

export type FilterResult = { keep: true } | { keep: false; reason: DiscardReason };

export const filterAniListMedia = (media: Pick<AniListMedia, "id" | "idMal" | "isAdult" | "format" | "genres" | "status" | "averageScore" | "popularity">): FilterResult => {
  if (!media.idMal) return { keep: false, reason: "missing_idMal" };
  if (media.isAdult) return { keep: false, reason: "adult" };
  if (!media.format || !allowedFormats.has(media.format)) return { keep: false, reason: "blocked_format" };
  if (media.genres.some((genre) => blockedGenres.has(genre.toLowerCase()))) return { keep: false, reason: "blocked_genre" };

  const popularity = media.popularity ?? 0;
  if (media.status === "NOT_YET_RELEASED") {
    return popularity >= 10_000 ? { keep: true } : { keep: false, reason: "not_released_low_popularity" };
  }

  const score = media.averageScore ?? 0;
  const minimums = media.format === "OVA" || media.format === "SPECIAL" ? { score: 65, popularity: 3_000 } : { score: 60, popularity: 1_000 };
  if (score < minimums.score || popularity < minimums.popularity) return { keep: false, reason: "low_quality_threshold" };

  return { keep: true };
};
