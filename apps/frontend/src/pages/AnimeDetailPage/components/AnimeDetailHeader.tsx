import { ArrowLeft, Bookmark, Check, Clock, ExternalLink, Play, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import type { UserAnimeListStatus } from "@template/shared";

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

const listIcon: Record<UserAnimeListStatus, React.ReactNode> = {
  watching: <Clock size={16} />,
  completed: <Check size={16} />,
  pending: <Bookmark size={16} />,
};

const listOptions: { status: "watching" | "completed" | "pending"; label: string; icon: React.ReactNode }[] = [
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
  onSaveList: (status: "watching" | "completed" | "pending") => void;
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

  /* Rec 1: info rápida en una sola línea con · separadores */
  const infoParts = [
    anime.score ?? null,
    [anime.season, anime.year].filter(Boolean).join(" ") || null,
    anime.episodes ? `${anime.episodes} eps` : null,
  ].filter(Boolean) as string[];

  /* Rec 2: metadata inline, filtrar vacíos */
  const metaParts = [
    anime.titleEnglish ? `Inglés: ${anime.titleEnglish}` : null,
    anime.titleJapanese ? `Japonés: ${anime.titleJapanese}` : null,
    anime.studio ? `Estudio: ${anime.studio}` : null,
    anime.rating ? `Clasificación: ${anime.rating}` : null,
  ].filter(Boolean) as string[];

  const statusTone = getStatusTone(anime.status);

  return (
    <>
      <Link
        to="/explorar"
        className="inline-flex items-center gap-2 rounded-full border border-anime-border bg-anime-input px-4 py-2 text-sm font-black text-cream-primary transition hover:border-sabio-dim"
      >
        <ArrowLeft size={16} /> Volver al catálogo
      </Link>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Image */}
        <div className="relative overflow-hidden rounded-2xl border border-anime-border bg-anime-surface shadow-2xl shadow-black/30">
          {anime.imageUrl ? (
            <img src={anime.imageUrl} alt={anime.title} className="aspect-3/4 w-full object-cover" />
          ) : (
            <div className="flex aspect-3/4 items-center justify-center bg-sabio-dim/30 text-4xl font-black text-cream-primary">
              {anime.title.slice(0, 2)}
            </div>
          )}

          {/* Rec 4: gradiente de 3 capas para fusionar iconos con la imagen */}
          {token ? (
            <div className="absolute inset-x-0 bottom-0">
              <div className="h-16 bg-linear-to-t from-anime-main via-anime-main/60 to-transparent" />
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

        {/* Info */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-sabio-light">Ficha del anime</p>
          <h1 className="mt-2 text-4xl font-black tracking-tighter sm:text-5xl lg:text-6xl">{anime.title}</h1>

          {/* Rec 1: info rápida en una línea con · separadores */}
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-cream-secondary">
            <span className={`inline-flex items-center gap-1.5 ${statusTone.text}`}>
              <span className={`h-2 w-2 rounded-full ${statusTone.dot}`} />
              {statusTone.label}
            </span>
            {infoParts.map((part, i) => (
              <span key={i}>
                · {part}
              </span>
            ))}
          </p>

          {/* Rec 3: géneros como chips ultracompactos */}
          <div className="mt-3 flex flex-wrap gap-1">
            {anime.genres.map((genre) => (
              <span
                key={genre}
                className="rounded-full border border-anime-border/60 px-1.5 py-px text-[10px] font-bold text-cream-secondary"
              >
                {genre}
              </span>
            ))}
          </div>

          {/* Sinopsis truncada a 3 líneas con expandir */}
          <div className="relative mt-4 text-sm font-semibold leading-relaxed text-cream-secondary">
            <p className="line-clamp-3">
              {anime.synopsis ?? "No hay sinopsis disponible."}
            </p>
            {anime.synopsis && anime.synopsis.length > 120 ? (
              <>
                <button
                  type="button"
                  onClick={() => setSynopsisExpanded((e) => !e)}
                  className="mt-1 text-xs font-black text-sabio-light transition hover:text-sabio"
                >
                  {synopsisExpanded ? "Cerrar sinopsis" : "Ver más"}
                </button>
                {synopsisExpanded ? (
                  <div className="absolute left-0 top-full z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-anime-border bg-anime-surface/98 p-4 text-sm leading-relaxed text-cream-secondary shadow-2xl shadow-black/45 backdrop-blur sm:max-w-3xl">
                    <p>{anime.synopsis}</p>
                    <button
                      type="button"
                      onClick={() => setSynopsisExpanded(false)}
                      className="mt-3 text-xs font-black text-sabio-light transition hover:text-sabio"
                    >
                      Ver menos
                    </button>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>

          {/* Rec 2: metadata inline con · separadores, solo datos presentes */}
          {metaParts.length > 0 ? (
            <p className="mt-3 text-[11px] font-semibold text-cream-secondary">
              {metaParts.map((part, i) => (
                <span key={i}>
                  {i > 0 ? " · " : ""}
                  {part}
                </span>
              ))}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {continueWatching ? (
              <Link
                to={`/watch/${anime.malId}?season=${continueWatching.season}&episode=${continueWatching.episode}`}
                className="inline-flex items-center gap-2 rounded-full bg-sabio px-5 py-2.5 text-sm font-black text-anime-main transition hover:bg-sabio-light"
              >
                <Play size={16} fill="currentColor" /> Continuar ep {continueWatching.episode} · {formatTime(continueWatching.progressSeconds)}
              </Link>
            ) : null}
            {currentList && listIcon[currentList] ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sabio-dim bg-sabio/10 px-3 py-2 text-xs font-bold text-sabio-light">
                {listIcon[currentList]} {listStatusLabel[currentList]}
              </span>
            ) : null}
            {anime.trailerUrl ? (
              <a
                href={anime.trailerUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-anime-border bg-anime-input px-5 py-2.5 text-sm font-black text-cream-primary transition hover:border-sabio-dim"
              >
                Tráiler <ExternalLink size={14} />
              </a>
            ) : null}
          </div>

          {listMessage ? <p className="mt-3 text-xs font-bold text-cream-secondary">{listMessage}</p> : null}
        </div>
      </div>
    </>
  );
};
