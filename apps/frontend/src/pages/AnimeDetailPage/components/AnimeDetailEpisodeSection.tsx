import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, CheckCircle2, ChevronDown, Play, Search, Server } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { AnimeEpisode } from "@template/shared";

import {
  filterEpisodesByQuery,
  formatAnimeFormatLabel,
  formatEpisodeCountLabel,
  getEpisodeRowCtaLabel,
  getPrimaryWatchCtaLabel,
  isMovieFormat,
} from "../../../lib/animeLabels";
import { addonApi, type Anime, type AnimeProgress, type Stream } from "../../../lib/api";

type AnimeDetailEpisodeSectionProps = {
  anime: Anime;
  episodes: AnimeEpisode[];
  progress: AnimeProgress[] | undefined;
  continueWatching: AnimeProgress | null | undefined;
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

const formatDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};

const buildManualEpisodes = (anime: Anime): AnimeEpisode[] =>
  anime.episodes && anime.episodes > 0
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

const streamTypeLabel = { hls: "HLS", mp4: "MP4", unknown: "Desconocido", torrent: "Torrent" } satisfies Record<Stream["type"], string>;

export const streamKey = (stream: Stream, index: number) => {
  const streamLocator = stream.type === "torrent" ? stream.magnet : stream.url;
  return `${stream.addonName}-${stream.title}-${streamLocator}-${index}`;
};

type EpisodeSourcesPanelProps = {
  animeTitle: string;
  malId: number;
  season: number;
  episode: number;
  onBack: () => void;
};

export const EpisodeSourcesPanel = ({ animeTitle, malId, season, episode, onBack }: EpisodeSourcesPanelProps) => {
  const streamsQuery = useQuery({
    queryKey: ["addon-streams", malId, season, episode],
    queryFn: () => addonApi.streams({ malId, season, episode }),
  });
  const streams = streamsQuery.data?.streams ?? [];

  return (
    <section data-testid="episode-sources-panel" className="flex h-full min-h-0 flex-col overflow-hidden bg-anime-main p-5 sm:p-6">
      <div className="shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full bg-anime-input px-4 py-2 text-xs font-black text-cream-primary transition hover:bg-white/10"
        >
          <ArrowLeft size={14} /> Volver a capítulos
        </button>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-sabio-light">Streams</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-cream-primary">Fuentes disponibles</h2>
        <p className="mt-2 text-sm font-bold text-cream-secondary">
          {animeTitle} · Capítulo {episode}
        </p>
      </div>

      <div className="scrollbar-none mt-5 min-h-0 basis-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {streamsQuery.isLoading ? (
          <div className="space-y-3" aria-live="polite">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-xl border border-anime-border bg-anime-input/55" />
            ))}
          </div>
        ) : null}

        {streamsQuery.error ? (
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-100">
            No pudimos cargar las fuentes: {streamsQuery.error.message}
          </div>
        ) : null}

        {streamsQuery.data && streams.length === 0 ? (
          <div className="rounded-xl border border-anime-border bg-anime-input/70 p-5 text-center">
            <p className="text-lg font-black text-cream-primary">No encontramos fuentes para este capítulo.</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-cream-secondary">
              Revisá tu configuración de addons o agregá uno compatible con streams.
            </p>
            <a
              href="/addons"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-sabio px-5 py-3 text-sm font-black text-anime-main transition hover:bg-sabio-light"
            >
              <Server size={15} /> Configurar addons
            </a>
          </div>
        ) : null}

        {streams.map((stream, index) => (
          <button
            key={streamKey(stream, index)}
            type="button"
            className="grid w-full gap-3 rounded-xl border border-anime-border bg-anime-input/55 p-4 text-left transition hover:border-sabio-dim hover:bg-anime-input/75 sm:grid-cols-[9rem_minmax(0,1fr)]"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-cream-primary">{stream.addonName}</p>
              <p className="mt-2 inline-flex rounded-full bg-sabio/15 px-2.5 py-1 text-[10px] font-black text-sabio-light">{stream.resolution}</p>
            </div>
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-black leading-snug text-cream-primary">{stream.title}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-cream-secondary">
                <span className="rounded-full bg-black/20 px-2.5 py-1">{streamTypeLabel[stream.type]}</span>
                {typeof stream.seeders === "number" ? <span className="rounded-full bg-black/20 px-2.5 py-1">Seeders {stream.seeders}</span> : null}
                {stream.language ? <span className="rounded-full bg-black/20 px-2.5 py-1">{stream.language}</span> : null}
                {stream.subtitles?.length ? <span className="rounded-full bg-black/20 px-2.5 py-1">Subs: {stream.subtitles.join(", ")}</span> : null}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export const AnimeDetailEpisodeSection = ({
  anime,
  episodes: episodesData,
  progress,
  continueWatching,
  season,
  onSeasonChange,
  manualEpisode,
  onManualEpisodeChange,
}: AnimeDetailEpisodeSectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceEpisode, setSourceEpisode] = useState<number | null>(null);
  const isMovie = isMovieFormat(anime.format);

  const seasonOptions = useMemo(() => {
    const seasons = [...new Set(episodesData.map((episode) => episode.season))]
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => a - b);

    return seasons.length ? seasons : [season || 1];
  }, [episodesData, season]);

  const selectedSeasonEpisodes = useMemo(() => {
    const concreteRows = [...episodesData]
      .filter((episode) => episode.season === season)
      .sort((a, b) => a.episode - b.episode);

    if (concreteRows.length) return concreteRows;
    return season === 1 ? buildManualEpisodes(anime) : [];
  }, [anime, episodesData, season]);

  const defaultExpandedEpisode = continueWatching?.season === season ? continueWatching.episode : selectedSeasonEpisodes[0]?.episode;
  const [expandedEpisode, setExpandedEpisode] = useState<number | null>(defaultExpandedEpisode ?? null);

  useEffect(() => {
    setExpandedEpisode(defaultExpandedEpisode ?? null);
    setSourceEpisode(null);
  }, [defaultExpandedEpisode, anime.id, season]);

  const progressByEpisode = useMemo(() => {
    const map = new Map<number, AnimeProgress>();
    for (const item of progress ?? []) {
      if (item.season === season) map.set(item.episode, item);
    }
    return map;
  }, [progress, season]);

  const visibleEpisodes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      return filterEpisodesByQuery(selectedSeasonEpisodes, query);
    }

    return selectedSeasonEpisodes;
  }, [searchQuery, selectedSeasonEpisodes]);

  if (isMovie) {
    return (
      <section className="flex h-full min-h-0 flex-col overflow-hidden bg-anime-main p-5 sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-sabio-light">Película</p>
        <div className="mt-4 border border-sabio/20 bg-linear-to-br from-sabio/15 via-anime-input to-anime-main p-5">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-black tracking-tight text-cream-primary">{anime.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-cream-secondary">
              Reproducción directa de {formatAnimeFormatLabel(anime.format).toLowerCase()}. {anime.duration ? `Duración estimada: ${anime.duration}.` : "Duración pendiente de confirmar."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-cream-secondary">
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">{formatEpisodeCountLabel(anime.format, anime.episodes)}</span>
              {anime.year ? <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">{anime.year}</span> : null}
              {anime.studio ? <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">{anime.studio}</span> : null}
            </div>
            <a
              href={`/watch/${anime.malId}?season=1&episode=1`}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-sabio px-5 py-3 text-sm font-black text-anime-main transition hover:bg-sabio-light"
            >
              <Play size={16} fill="currentColor" /> {getPrimaryWatchCtaLabel({ format: anime.format, continueEpisode: continueWatching?.episode })}
            </a>
          </div>
        </div>
      </section>
    );
  }

  const selectedEpisode = Math.max(1, manualEpisode);

  if (sourceEpisode) {
    return <EpisodeSourcesPanel animeTitle={anime.title} malId={anime.malId} season={season} episode={sourceEpisode} onBack={() => setSourceEpisode(null)} />;
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-anime-main p-5 sm:p-6">
      <div className="flex shrink-0 flex-col gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-sabio-light">Episodios</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-cream-primary">Capítulos</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative inline-flex items-center">
            <span className="sr-only">Temporada</span>
            <select
              value={season}
              onChange={(event) => onSeasonChange(Number(event.target.value))}
              className="h-10 min-w-36 cursor-pointer rounded-full border border-anime-border bg-anime-input px-3 pr-8 text-xs font-black text-cream-primary outline-none transition hover:border-sabio-dim focus:border-sabio-dim"
            >
              {seasonOptions.map((seasonOption) => (
                <option key={seasonOption} value={seasonOption}>
                  Temporada {seasonOption}
                </option>
              ))}
            </select>
          </label>
          <label className="relative block min-w-56 flex-1 sm:flex-none">
            <span className="sr-only">Buscar episodio</span>
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cream-secondary" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar número o título"
              className="h-10 w-full rounded-full border border-anime-border bg-anime-input pl-9 pr-3 text-xs font-bold text-cream-primary outline-none transition placeholder:text-cream-secondary/70 focus:border-sabio-dim"
            />
          </label>
        </div>
      </div>

      {visibleEpisodes.length ? (
        <div data-testid="episode-scroll-container" className="scrollbar-none mt-5 min-h-0 basis-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {visibleEpisodes.map((episode) => {
            const episodeProgress = progressByEpisode.get(episode.episode);
            const isWatched = episodeProgress?.watched;
            const airedAt = formatDate(episode.airedAt);
            const isExpanded = expandedEpisode === episode.episode;
            return (
              <article
                key={`${episode.season}-${episode.episode}`}
                className={`rounded-xl border border-anime-border bg-anime-input/45 transition ${isExpanded ? "bg-anime-input/80" : "hover:border-sabio-dim hover:bg-anime-input/65"}`}
              >
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => setExpandedEpisode((current) => (current === episode.episode ? null : episode.episode))}
                  className="grid w-full gap-3 p-3.5 text-left sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black text-cream-primary">Capítulo {episode.episode}</p>
                      {isWatched ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sabio/10 px-2 py-1 text-[10px] font-black text-sabio-light">
                          <CheckCircle2 size={11} /> Visto
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-1 line-clamp-1 text-xs font-bold text-cream-secondary">{episode.title ?? `Episodio ${episode.episode}`}</h3>
                  </div>
                  <ChevronDown className={`text-cream-secondary transition ${isExpanded ? "rotate-180 text-sabio-light" : ""}`} size={16} />
                </button>

                {isExpanded ? (
                  <div className="px-3.5 pb-3.5 pt-0">
                    <p className="text-xs font-semibold leading-relaxed text-cream-secondary">
                      Descripción no disponible todavía. Usamos este espacio para ubicar el episodio sin agregar campos nuevos al catálogo.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-cream-secondary">
                      {airedAt ? (
                        <span className="inline-flex items-center gap-1"><CalendarDays size={11} /> {airedAt}</span>
                      ) : null}
                      {episodeProgress && !isWatched ? <span>Progreso {formatTime(episodeProgress.progressSeconds)}</span> : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSourceEpisode(episode.episode)}
                      className="mt-4 inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-sabio px-4 text-xs font-black text-anime-main transition hover:bg-sabio-light"
                    >
                      <Play size={13} fill="currentColor" /> Ver capítulo
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3 border border-anime-border bg-anime-input/70 p-4 sm:flex-row sm:items-end">
          <label className="block">
            <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-cream-secondary">Episodio manual</span>
            <input
              type="number"
              min={1}
              value={selectedEpisode}
              onChange={(event) => onManualEpisodeChange(Math.max(1, Number.parseInt(event.target.value, 10) || 1))}
              className="h-10 w-32 rounded-xl border border-anime-border bg-anime-main px-3 text-sm font-black text-cream-primary outline-none transition focus:border-sabio-dim"
            />
          </label>
          <button
            type="button"
            onClick={() => setSourceEpisode(selectedEpisode)}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-sabio px-5 text-sm font-black text-anime-main transition hover:bg-sabio-light"
          >
            Ver episodio
          </button>
        </div>
      )}
    </section>
  );
};
