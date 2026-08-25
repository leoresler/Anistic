import type { AnimeFormat } from "@template/shared";
import type { AnimeEpisode } from "@template/shared";

export const EPISODE_RANGE_SIZE = 50;

const formatLabels = {
  TV: "Serie",
  MOVIE: "Película",
  ONA: "ONA",
  OVA: "OVA",
  SPECIAL: "Especial",
} satisfies Record<AnimeFormat, string>;

export const formatAnimeFormatLabel = (format: string | null | undefined) => {
  if (!format) return "Anime";
  return format in formatLabels ? formatLabels[format as AnimeFormat] : format;
};

export const isMovieFormat = (format: string | null | undefined) => format === "MOVIE";

export const formatEpisodeCountLabel = (format: string | null | undefined, episodes: number | null | undefined) => {
  if (isMovieFormat(format)) return "Película";
  if (!episodes) return "Episodios por confirmar";
  return episodes === 1 ? "1 episodio" : `${episodes} episodios`;
};

export const getPrimaryWatchCtaLabel = (input: {
  format?: string | null;
  continueEpisode?: number | null;
}) => {
  if (isMovieFormat(input.format)) return "Ver película";
  if (input.continueEpisode) return `Continuar episodio ${input.continueEpisode}`;
  return "Ver episodio 1";
};

export const getEpisodeRangeLabel = (start: number, end: number) => `Eps ${start}-${end}`;

export const getEpisodeRowCtaLabel = (watched: boolean | undefined, progressSeconds: number | undefined) => {
  if (watched) return "Ver de nuevo";
  if (progressSeconds && progressSeconds > 0) return "Continuar";
  return "Ver episodio";
};

export type EpisodeRange = {
  start: number;
  end: number;
};

export const buildEpisodeRanges = (episodes: Pick<AnimeEpisode, "episode">[], rangeSize = EPISODE_RANGE_SIZE): EpisodeRange[] => {
  if (!episodes.length) return [];
  const ordered = episodes.map((episode) => episode.episode).sort((left, right) => left - right);
  const firstEpisode = ordered[0] ?? 1;
  const lastEpisode = ordered.at(-1) ?? firstEpisode;
  const firstStart = Math.floor((firstEpisode - 1) / rangeSize) * rangeSize + 1;
  const ranges: EpisodeRange[] = [];

  for (let start = firstStart; start <= lastEpisode; start += rangeSize) {
    ranges.push({ start, end: Math.min(start + rangeSize - 1, lastEpisode) });
  }

  return ranges;
};

export const getDefaultEpisodeRangeStart = (ranges: EpisodeRange[], continueEpisode: number | null | undefined) => {
  const matchingRange = continueEpisode
    ? ranges.find((range) => continueEpisode >= range.start && continueEpisode <= range.end)
    : undefined;

  return matchingRange?.start ?? ranges[0]?.start ?? null;
};

export const filterEpisodesByQuery = <T extends Pick<AnimeEpisode, "episode" | "title">>(episodes: T[], query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return episodes;

  return episodes.filter((episode) => {
    const numberMatches = String(episode.episode).includes(normalized);
    const titleMatches = episode.title?.toLowerCase().includes(normalized) ?? false;
    return numberMatches || titleMatches;
  });
};

export const filterEpisodesByRange = <T extends Pick<AnimeEpisode, "episode">>(episodes: T[], range: EpisodeRange | undefined) => {
  if (!range) return episodes;
  return episodes.filter((episode) => episode.episode >= range.start && episode.episode <= range.end);
};
