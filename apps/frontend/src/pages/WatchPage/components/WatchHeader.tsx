import { ArrowLeft, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import type { AnimeProgress } from "../../../lib/api";

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;

type WatchHeaderProps = {
  malId: number;
  animeTitle?: string;
  season: number;
  episode: number;
  selectedStreamTitle?: string | null;
  currentProgress: AnimeProgress | undefined;
  children: ReactNode;
};

export const WatchHeader = ({
  malId,
  animeTitle,
  season,
  episode,
  selectedStreamTitle,
  currentProgress,
  children,
}: WatchHeaderProps) => (
  <>
    <Link
      to={`/anime/${malId}`}
      className="inline-flex items-center gap-2 rounded-full border border-anime-border bg-anime-input px-4 py-2 text-sm font-black text-cream-primary transition hover:border-sabio-dim"
    >
      <ArrowLeft size={16} /> Volver al detalle
    </Link>

    <header className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.32em] text-sabio-light">Reproductor</p>
        <h1 className="mt-3 text-4xl font-black tracking-tighter">{animeTitle ?? "Ver anime"}</h1>
        <p className="mt-2 font-bold text-cream-secondary">
          Temporada {season} · Episodio {episode}
        </p>
        {selectedStreamTitle ? <p className="mt-2 font-bold text-cream-secondary">Reproduciendo: {selectedStreamTitle}</p> : null}
        {currentProgress && !currentProgress.watched ? (
          <p className="mt-2 font-bold text-sabio-light">Continuar desde {formatTime(currentProgress.progressSeconds)}</p>
        ) : null}
        {currentProgress?.watched ? (
          <p className="mt-2 inline-flex items-center gap-2 font-black text-sabio">
            <CheckCircle2 size={18} /> Episodio visto
          </p>
        ) : null}
      </div>
      {children}
    </header>
  </>
);
