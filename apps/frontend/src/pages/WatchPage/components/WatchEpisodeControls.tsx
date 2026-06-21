import { ChevronLeft, ChevronRight } from "lucide-react";

type WatchEpisodeControlsProps = {
  season: number;
  episode: number;
  knownEpisodes: number | null;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onUpdateEpisode: (nextEpisode: number, nextSeason?: number) => void;
};

export const WatchEpisodeControls = ({
  season,
  episode,
  knownEpisodes,
  canGoPrevious,
  canGoNext,
  onUpdateEpisode,
}: WatchEpisodeControlsProps) => (
  <div className="flex flex-wrap items-end gap-3">
    <button
      type="button"
      disabled={!canGoPrevious}
      onClick={() => onUpdateEpisode(episode - 1)}
      className="inline-flex h-12 items-center gap-2 rounded-2xl border border-anime-border bg-anime-input px-4 font-black text-cream-primary transition hover:border-sabio-dim disabled:opacity-40"
    >
      <ChevronLeft size={18} /> Anterior
    </button>
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-cream-secondary">Temporada</span>
      <input
        type="number"
        min={1}
        value={season}
        onChange={(event) => onUpdateEpisode(episode, Math.max(1, Number.parseInt(event.target.value, 10) || 1))}
        className="h-12 w-28 rounded-2xl border border-anime-border bg-anime-input px-4 font-black text-cream-primary outline-none transition focus:border-sabio-dim"
      />
    </label>
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-cream-secondary">Episodio</span>
      <select
        value={episode}
        onChange={(event) => onUpdateEpisode(Number.parseInt(event.target.value, 10))}
        className="h-12 w-36 cursor-pointer rounded-2xl border border-anime-border bg-anime-input px-4 font-black text-cream-primary outline-none transition focus:border-sabio-dim"
      >
        {Array.from({ length: knownEpisodes ?? Math.max(episode + 5, 12) }, (_, index) => index + 1).map((item) => (
          <option key={item} value={item}>
            Episodio {item}
          </option>
        ))}
      </select>
    </label>
    <button
      type="button"
      disabled={!canGoNext}
      onClick={() => onUpdateEpisode(episode + 1)}
      className="inline-flex h-12 items-center gap-2 rounded-2xl bg-sabio px-4 font-black text-anime-main transition hover:bg-sabio-light disabled:opacity-40"
    >
      Siguiente <ChevronRight size={18} />
    </button>
  </div>
);
