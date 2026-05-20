import { Badge } from '../../../shared/components/Badge';
import { ProgressBar } from '../../../shared/components/ProgressBar';
import { ScorePill } from '../../../shared/components/ScorePill';
import { myListAnime } from '../../../shared/mocks/animeData';

export function ListTable() {
  return (
    <section className="panel overflow-hidden">
      <div className="table-head hidden md:grid md:grid-cols-[1.6fr_0.8fr_0.8fr_1fr_0.8fr]">
        <span>Title</span><span>Status</span><span>Score</span><span className="hidden md:block">Progress</span><span className="hidden md:block">Year</span>
      </div>
      <div className="divide-y divide-[--color-border]">
        {myListAnime.map((anime, index) => (
          <article key={anime.id} className={`table-row grid-cols-1 gap-y-3 md:grid-cols-[1.6fr_0.8fr_0.8fr_1fr_0.8fr] md:items-center ${index === 0 ? 'table-row-featured' : ''}`}>
            <div className="flex min-w-0 items-center gap-3">
              <div className="poster-mini h-14 w-10 shrink-0" style={{ backgroundColor: anime.accentColor }}><div className="poster-overlay-card absolute inset-0" /></div>
              <div className="min-w-0">
                <p className="eyebrow tracking-[0.26em]">{anime.genres[0]}</p>
                <h3 className="mt-1 truncate text-sm font-medium text-[--color-text]">{anime.title}</h3>
                <p className="truncate text-xs text-[--color-text-soft]">{anime.studio}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:block md:gap-0">
              <span className="eyebrow md:hidden">Status</span>
              <Badge status={anime.status} />
            </div>
            <div className="flex flex-wrap items-center gap-2 md:block md:gap-0">
              <span className="eyebrow md:hidden">Score</span>
              <ScorePill score={anime.score} />
            </div>
            <div className="space-y-2 md:space-y-0">
              <span className="eyebrow md:hidden">Progress</span>
              <div className="md:flex md:items-center"><ProgressBar value={Math.min(anime.episodes * 4, 100)} /></div>
            </div>
            <div className="flex items-center gap-2 text-sm text-[--color-text-soft] md:block">
              <span className="eyebrow md:hidden">Year</span>
              <span>{anime.year}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
