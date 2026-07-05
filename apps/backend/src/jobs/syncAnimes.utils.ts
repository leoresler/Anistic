import { sql } from "drizzle-orm";

import { animes, type NewAnime } from "@template/database";

export type AniListFormat = "TV" | "MOVIE" | "OVA" | "ONA" | "SPECIAL";

export type AniListStatus = "FINISHED" | "RELEASING" | "NOT_YET_RELEASED" | "CANCELLED" | "HIATUS";

export type AniListSource =
  | "ORIGINAL"
  | "MANGA"
  | "LIGHT_NOVEL"
  | "VISUAL_NOVEL"
  | "VIDEO_GAME"
  | "OTHER"
  | "MUSIC"
  | "GAME"
  | "COMIC"
  | "NOVEL"
  | "DOUJINSHI"
  | "MULTIMEDIA_PROJECT"
  | "PICTURE_BOOK"
  | "RADIO";

export type AniListSeason = "WINTER" | "SPRING" | "SUMMER" | "FALL";

export type AniListRanking = {
  type: "RATED" | "POPULAR";
  allTime: boolean;
  rank: number;
};

export type AniListStudio = {
  id: number;
  name: string;
  isAnimationStudio: boolean;
};

export type AniListTitle = {
  romaji: string | null;
  english: string | null;
  native: string | null;
};

export type AniListMedium = {
  id: number;
  idMal: number | null;
  title: AniListTitle;
  description: string | null;
  averageScore: number | null;
  popularity: number | null;
  episodes: number | null;
  status: AniListStatus | null;
  season: AniListSeason | null;
  seasonYear: number | null;
  startDate: { year: number | null; month: number | null; day: number | null } | null;
  duration: number | null;
  source: AniListSource | null;
  format: AniListFormat | null;
  coverImage: { extraLarge: string | null } | null;
  bannerImage: string | null;
  studios: { nodes: AniListStudio[] } | null;
  genres: string[] | null;
  rankings: AniListRanking[] | null;
  countryOfOrigin: string | null;
  isAdult: boolean;
};

export type AniListPageInfo = {
  hasNextPage: boolean;
  total: number;
};

export type AniListPageResponse = {
  data: {
    Page: {
      pageInfo: AniListPageInfo;
      media: AniListMedium[];
    };
  };
};

export const buildAnimeUpsertSet = (record: NewAnime) => ({
  // source-overwrite: always overwrite from the incoming record
  malId: record.malId,
  anilistId: record.anilistId,
  title: record.title,
  titleEnglish: record.titleEnglish,
  titleJapanese: record.titleJapanese,
  bannerUrl: record.bannerUrl,
  anilistPopularity: record.anilistPopularity,
  status: record.status,
  score: record.score,
  year: record.year,
  season: record.season,
  studio: record.studio,
  duration: record.duration,
  source: record.source,
  countryOfOrigin: record.countryOfOrigin,
  isAdult: record.isAdult,
  syncedAt: record.syncedAt,

  // preserve-if-null: keep existing DB value when the incoming value is null
  synopsis: record.synopsis ?? sql`${animes.synopsis}`,
  imageUrl: record.imageUrl ?? sql`${animes.imageUrl}`,
  trailerUrl: record.trailerUrl ?? sql`${animes.trailerUrl}`,
  episodes: record.episodes ?? sql`${animes.episodes}`,
  rank: record.rank ?? sql`${animes.rank}`,
  popularity: record.popularity ?? sql`${animes.popularity}`,
  startDate: record.startDate ?? sql`${animes.startDate}`,
  format: record.format ?? sql`${animes.format}`,
});

export const mapAniListStatus = (status: AniListStatus | null): string | null => {
  if (status === null) return null;

  switch (status) {
    case "FINISHED":
    case "CANCELLED":
      return "Finished Airing";
    case "RELEASING":
    case "HIATUS":
      return "Airing";
    case "NOT_YET_RELEASED":
      return "Not yet aired";
    default:
      return null;
  }
};

export const mapAniListSource = (source: AniListSource | null): string | null => {
  if (source === null) return null;

  const mapping: Record<AniListSource, string> = {
    ORIGINAL: "Original",
    MANGA: "Manga",
    LIGHT_NOVEL: "Light Novel",
    VISUAL_NOVEL: "Visual Novel",
    VIDEO_GAME: "Video Game",
    OTHER: "Other",
    MUSIC: "Music",
    GAME: "Game",
    COMIC: "Comic",
    NOVEL: "Novel",
    DOUJINSHI: "Doujinshi",
    MULTIMEDIA_PROJECT: "Multimedia Project",
    PICTURE_BOOK: "Picture Book",
    RADIO: "Radio",
  };

  return mapping[source] ?? null;
};

export const mapAniListDuration = (
  duration: number | null,
  format: AniListFormat | null,
): string | null => {
  if (duration === null) return null;

  if (format === "MOVIE") {
    if (duration >= 60) {
      return `${Math.floor(duration / 60)} hr ${duration % 60} min`;
    }
    return `${duration} min`;
  }

  return `${duration} min/ep`;
};

export const mapAniListSeason = (season: AniListSeason | null): string | null => {
  if (season === null) return null;

  switch (season) {
    case "WINTER":
      return "winter";
    case "SPRING":
      return "spring";
    case "SUMMER":
      return "summer";
    case "FALL":
      return "fall";
    default:
      return null;
  }
};

export const stripHtml = (html: string): string => {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim()
    .replace(/\n{3,}/g, "\n\n");
};

export const buildAniListQuery = (format: AniListFormat, page: number) => {
  const query = `query ($format: MediaFormat, $page: Int) {
  Page(page: $page, perPage: 50) {
    pageInfo {
      hasNextPage
      total
    }
    media(type: ANIME, format: $format, isAdult: false, popularity_greater: 1000, sort: POPULARITY_DESC) {
      id
      idMal
      title {
        romaji
        english
        native
      }
      description
      averageScore
      popularity
      episodes
      status
      season
      seasonYear
      startDate {
        year
        month
        day
      }
      duration
      source
      format
      coverImage {
        extraLarge
      }
      bannerImage
      studios {
        nodes {
          id
          name
          isAnimationStudio
        }
      }
      genres
      rankings {
        type
        allTime
        rank
      }
      countryOfOrigin
      isAdult
    }
  }
}`;

  return { query, variables: { format, page } };
};
