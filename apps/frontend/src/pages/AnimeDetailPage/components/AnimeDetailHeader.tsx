import { ArrowLeft, Bookmark, Check, Clock, ExternalLink, Play, Star, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

import type { UserAnimeListStatus } from "@template/shared";

import { formatAnimeFormatLabel, formatEpisodeCountLabel, getPrimaryWatchCtaLabel } from "../../../lib/animeLabels";
import type { Anime, AnimeProgress } from "../../../lib/api";

const statusLabel: Record<string, string> = {
  Airing: "En emisión",
  "Finished Airing": "Finalizado",
  "Not yet aired": "Próximamente",
};

const getStatusTone = (status: string | null) => {
  const normalized = status?.toLowerCase() ?? "";
  if (normalized.includes("finished") || normalized.includes("finalizado")) {
    return { label: statusLabel[status ?? ""] ?? "Finalizado", dot: "bg-sabio", text: "text-sabio-light" };
  }
  if (normalized.includes("airing") || normalized.includes("emisión")) {
    return { label: statusLabel[status ?? ""] ?? "En emisión", dot: "bg-yellow-400", text: "text-yellow-200" };
  }
  if (normalized.includes("cancel") || normalized.includes("dropped")) {
    return { label: "Cancelado", dot: "bg-red-400", text: "text-red-200" };
  }
  return { label: statusLabel[status ?? ""] ?? "Sin estado", dot: "bg-cream-secondary", text: "text-cream-secondary" };
};

const listStatusLabel: Record<UserAnimeListStatus, string> = {
  watching: "Viendo",
  completed: "Completado",
  pending: "Pendiente",
};

const listIcon: Record<UserAnimeListStatus, ReactNode> = {
  watching: <Clock size={16} />,
  completed: <Check size={16} />,
  pending: <Bookmark size={16} />,
};

const listOptions: { status: UserAnimeListStatus; label: string; icon: ReactNode }[] = [
  { status: "watching", label: "Viendo", icon: <Clock size={16} /> },
  { status: "completed", label: "Completado", icon: <Check size={16} /> },
  { status: "pending", label: "Pendiente", icon: <Bookmark size={16} /> },
];

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
};

type AnimeDetailHeaderProps = {
  anime: Anime;
  continueWatching: AnimeProgress | null | undefined;
  token: string | null;
  currentList: UserAnimeListStatus | undefined;
  listMessage: string | null;
  onSaveList: (status: UserAnimeListStatus) => void;
  onRemoveList: () => void;
};

export const AnimeDetailHeader = ({
  anime,
  continueWatching,
  token,
  currentList,
  listMessage,
  onSaveList,
  onRemoveList,
}: AnimeDetailHeaderProps) => {
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const statusTone = getStatusTone(anime.status);
  const artworkUrl = anime.bannerUrl || anime.imageUrl;
  const initials = anime.title
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  const watchSeason = continueWatching?.season ?? 1;
  const watchEpisode = continueWatching?.episode ?? 1;
  const watchHref = `/watch/${anime.malId}?season=${watchSeason}&episode=${watchEpisode}`;
  const primaryCta = getPrimaryWatchCtaLabel({ format: anime.format, continueEpisode: continueWatching?.episode });
  const metadata = [
    anime.year ? String(anime.year) : null,
    formatEpisodeCountLabel(anime.format, anime.episodes),
    anime.studio ? `Estudio ${anime.studio}` : null,
    anime.countryOfOrigin ? `Origen ${anime.countryOfOrigin}` : null,
  ].filter(Boolean);

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden bg-anime-main">
      <div data-testid="anime-detail-banner-strip" className="relative h-[32vh] min-h-45 max-h-75 shrink-0 overflow-hidden border-b border-white/10">
        {artworkUrl ? (
          <img src={artworkUrl} alt="" className="absolute inset-0 h-full w-full object-cover object-center opacity-75" aria-hidden="true" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(235,190,111,0.22),transparent_34%),linear-gradient(135deg,rgba(20,26,42,0.96),rgba(5,7,12,1))]" />
        )}
        <div className="absolute inset-0 bg-linear-to-r from-anime-main/70 via-anime-main/20 to-anime-main/35" />
        <div className="absolute inset-0 bg-linear-to-t from-anime-main/85 via-anime-main/15 to-black/15" />
        <Link
          to="/explorar"
          className="absolute left-6 top-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-sm font-black text-cream-primary backdrop-blur transition hover:border-sabio-dim hover:bg-black/50 lg:left-10 lg:top-10"
        >
          <ArrowLeft size={16} /> Volver al catálogo
        </Link>
      </div>

      <div className="relative min-h-0 flex-1 overflow-visible px-5 pb-6 sm:px-7 lg:px-10 lg:pb-8">
        <div className="grid min-h-0 gap-6 lg:grid-cols-[190px_minmax(0,1fr)] lg:items-start xl:grid-cols-[220px_minmax(0,1fr)]">
          <div className="relative z-10 -mt-32 max-w-52 overflow-hidden rounded-3xl border border-white/15 bg-anime-main/70 shadow-2xl shadow-black/40 lg:-mt-36 lg:max-w-none">
            {anime.imageUrl ? (
              <img src={anime.imageUrl} alt={anime.title} className="aspect-3/4 w-full object-cover" />
            ) : (
              <div className="flex aspect-3/4 items-center justify-center bg-sabio-dim/30 text-4xl font-black text-cream-primary">
                {initials}
              </div>
            )}

            {token ? (
              <div className="absolute inset-x-0 bottom-0">
                <div className="h-16 bg-linear-to-t from-anime-main via-anime-main/70 to-transparent" />
                <div className="flex items-center gap-1.5 bg-anime-main/90 px-3 pb-2.5 backdrop-blur-sm">
                  {listOptions.map(({ status, label, icon }) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => onSaveList(status)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-black transition ${
                        currentList === status
                          ? "bg-sabio text-anime-main"
                          : "bg-anime-input/80 text-cream-primary hover:bg-sabio/30 hover:text-sabio-light"
                      }`}
                      aria-label={label}
                      title={label}
                    >
                      {icon}
                    </button>
                  ))}
                  {currentList ? (
                    <button
                      type="button"
                      onClick={onRemoveList}
                      className="ml-auto flex items-center rounded-full px-2 py-1.5 text-[11px] font-bold text-cream-secondary transition hover:bg-anime-input/80 hover:text-cream-primary"
                      title="Quitar de lista"
                    >
                      <X size={12} />
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="max-w-4xl pt-6 lg:pt-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-sabio/30 bg-sabio/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-sabio-light">
                {formatAnimeFormatLabel(anime.format)}
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${statusTone.text}`}>
                <span className={`h-2 w-2 rounded-full ${statusTone.dot}`} />
                {statusTone.label}
              </span>
              {anime.score ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cream-primary">
                  <Star size={11} fill="currentColor" /> {anime.score}
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tighter text-cream-primary sm:text-5xl lg:text-6xl xl:text-7xl">{anime.title}</h1>
            {anime.titleEnglish && anime.titleEnglish !== anime.title ? (
              <p className="mt-2 text-sm font-bold text-cream-secondary">{anime.titleEnglish}</p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              {metadata.map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-bold text-cream-secondary backdrop-blur">
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-5 max-w-3xl text-sm font-semibold leading-relaxed text-cream-secondary">
              <p className={synopsisExpanded ? "" : "line-clamp-3"}>{anime.synopsis ?? "No hay sinopsis disponible."}</p>
              {anime.synopsis && anime.synopsis.length > 180 ? (
                <button
                  type="button"
                  onClick={() => setSynopsisExpanded((expanded) => !expanded)}
                  className="mt-2 text-xs font-black text-sabio-light transition hover:text-sabio"
                >
                  {synopsisExpanded ? "Ver menos" : "Ver sinopsis completa"}
                </button>
              ) : null}
            </div>

            {anime.genres.length ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {anime.genres.slice(0, 8).map((genre) => (
                  <span key={genre} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold text-cream-secondary">
                    {genre}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Link
                to={watchHref}
                className="inline-flex items-center gap-2 rounded-full bg-sabio px-5 py-3 text-sm font-black text-anime-main transition hover:bg-sabio-light"
              >
                <Play size={16} fill="currentColor" /> {primaryCta}
                {continueWatching ? <span className="text-xs opacity-75">{formatTime(continueWatching.progressSeconds)}</span> : null}
              </Link>
              {currentList ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sabio-dim bg-sabio/10 px-3 py-2 text-xs font-bold text-sabio-light">
                  {listIcon[currentList]} {listStatusLabel[currentList]}
                </span>
              ) : null}
              {anime.trailerUrl ? (
                <a
                  href={anime.trailerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-5 py-3 text-sm font-black text-cream-primary transition hover:border-sabio-dim"
                >
                  Tráiler <ExternalLink size={14} />
                </a>
              ) : null}
            </div>

            {listMessage ? <p className="mt-3 text-xs font-bold text-cream-secondary">{listMessage}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
};
