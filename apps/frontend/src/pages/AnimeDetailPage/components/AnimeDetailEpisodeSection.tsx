import { useMemo } from "react";

import type { AnimeEpisode } from "@template/shared";

import type { Anime, AnimeProgress } from "../../../lib/api";

type AnimeDetailEpisodeSectionProps = {
  anime: Anime;
  episodes: AnimeEpisode[];
  progress: AnimeProgress[] | undefined;
  season: number;
  onSeasonChange: (season: number) => void;
  manualEpisode: number;
  onManualEpisodeChange: (episode: number) => void;
};

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
};

export const AnimeDetailEpisodeSection = ({
  anime,
  episodes: episodesData,
  progress,
  season,
  onSeasonChange,
  manualEpisode,
  onManualEpisodeChange,
}: AnimeDetailEpisodeSectionProps) => {
  const seasonOptions = useMemo(() => {
    const seasons = [...new Set(episodesData.map((episode) => episode.season))]
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => a - b);

    return seasons.length ? seasons : [season || 1];
  }, [episodesData, season]);

  const episodeRows = episodesData.filter((episode) => episode.season === season);
  const episodes = episodeRows.length
    ? episodeRows
    : anime.episodes && anime.episodes > 0
      ? Array.from({ length: anime.episodes }, (_, index) => ({
          animeId: anime.id,
          season: 1,
          episode: index + 1,
          title: `Episodio ${index + 1}`,
          thumbnailUrl: null,
          airedAt: null,
          createdAt: "",
        }))
      : [];

  const progressByEpisode = useMemo(() => {
    const map = new Map<number, AnimeProgress>();
    for (const item of progress ?? []) {
      if (item.season === season) map.set(item.episode, item);
    }
    return map;
  }, [progress, season]);

  const selectedEpisode = episodes.length ? manualEpisode : Math.max(1, manualEpisode);

  return (
    <section className="mt-10 rounded-2xl border border-anime-border bg-anime-surface p-5 shadow-2xl shadow-black/30">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-sabio-light">Episodios</p>
        <label className="relative inline-flex items-center">
          <span className="sr-only">Temporada</span>
          <select
            value={season}
            onChange={(event) => onSeasonChange(Number(event.target.value))}
            className="h-9 min-w-36 cursor-pointer rounded-full border border-anime-border bg-anime-input px-3 pr-8 text-xs font-black text-cream-primary outline-none transition hover:border-sabio-dim focus:border-sabio-dim"
          >
            {seasonOptions.map((seasonOption) => (
              <option key={seasonOption} value={seasonOption}>
                Temporada {seasonOption}
              </option>
            ))}
          </select>
        </label>
      </div>

      {episodes.length ? (
        <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10">
          {episodes.map((episode) => {
            const episodeProgress = progressByEpisode.get(episode.episode);
            const isWatched = episodeProgress?.watched;
            return (
              <a
                key={`${episode.season}-${episode.episode}`}
                href={`/watch/${anime.malId}?season=${episode.season}&episode=${episode.episode}`}
                className={`relative flex h-9 items-center justify-center rounded-xl border px-3 text-center text-xs font-bold transition ${
                  isWatched
                    ? "border-sabio/50 bg-sabio/10 text-sabio-light ring-1 ring-sabio/30"
                    : "border-anime-border bg-anime-input text-cream-primary hover:border-sabio-dim hover:bg-anime-main"
                }`}
              >
                {isWatched && (
                  <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-sabio" />
                )}
                <span className="line-clamp-1">{episode.title ?? `E${episode.episode}`}</span>
                {episodeProgress && !isWatched ? (
                  <span className="absolute bottom-0.5 right-2 text-[9px] text-sabio-light/70">
                    {formatTime(episodeProgress.progressSeconds)}
                  </span>
                ) : null}
              </a>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block">
            <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-cream-secondary">Episodio manual</span>
            <input
              type="number"
              min={1}
              value={selectedEpisode}
              onChange={(event) => onManualEpisodeChange(Math.max(1, Number.parseInt(event.target.value, 10) || 1))}
              className="h-10 w-32 rounded-xl border border-anime-border bg-anime-input px-3 text-sm font-black text-cream-primary outline-none transition focus:border-sabio-dim"
            />
          </label>
          <a
            href={`/watch/${anime.malId}?season=${season}&episode=${selectedEpisode}`}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-sabio px-5 text-sm font-black text-anime-main transition hover:bg-sabio-light"
          >
            Ver episodio
          </a>
        </div>
      )}
    </section>
  );
};
