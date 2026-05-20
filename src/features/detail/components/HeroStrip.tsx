import type { Anime } from '../../../shared/mocks/animeData';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { ScorePill } from '../../../shared/components/ScorePill';

export function HeroStrip({ anime }: { anime: Anime }) {
  return (
    <section className="panel overflow-hidden">
      <div className="relative min-h-[320px] p-4 sm:p-6 lg:min-h-[380px] lg:p-8" style={{ backgroundColor: anime.accentColor }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,234,206,0.22),transparent_28%),radial-gradient(circle_at_78%_12%,var(--fx-sky-18),transparent_22%),linear-gradient(145deg,rgba(21,15,12,0.14),rgba(8,6,5,0.86))]" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[rgba(255,234,206,0.10)] to-transparent" />
        <div className="absolute left-6 top-6 h-20 w-20 rounded-full bg-[rgba(255,234,206,0.10)] blur-3xl sm:left-10 sm:top-10 sm:h-28 sm:w-28" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="max-w-3xl min-w-0 space-y-5 sm:space-y-6">
            <p className="eyebrow-soft text-[11px] tracking-[0.34em]">Series detail</p>
            <h1 className="text-3xl font-semibold tracking-[-0.05em] text-[--color-text] sm:text-4xl md:text-5xl lg:text-6xl">{anime.title}</h1>
            <p className="max-w-2xl text-sm leading-7 text-[--color-text-soft]">Static cinematic hero strip with deeper fog layering, calmer metadata spacing, and more premium contrast between content blocks.</p>
            <div className="flex flex-wrap items-center gap-3">
              <Badge status={anime.status} />
              <ScorePill score={anime.score} />
              <span className="text-sm text-[--color-text-soft]">{anime.year} • {anime.episodes} episodes • {anime.studio}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button>Continue Watching</Button>
              <Button variant="ghost">Add to Shelf</Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="frost-panel p-5 text-[--color-text]">
              <p className="eyebrow-soft">Genre spread</p>
              <p className="mt-3 text-lg font-medium text-[--color-text]">{anime.genres.join(' · ')}</p>
              <p className="mt-3 body-copy">Cohesive metadata paneling instead of disconnected boxes.</p>
            </div>
            <div className="frost-panel p-5 text-[--color-text]">
              <p className="eyebrow-soft">Catalog note</p>
              <p className="mt-3 text-3xl font-semibold tracking-[0.2em] text-[--color-text]">{anime.title.slice(0, 2).toUpperCase()}</p>
              <p className="mt-3 body-copy">The detail page now behaves like a feature spread, not a plain metadata header.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
