import type { Anime } from '../mocks/animeData';
import { Badge } from './Badge';
import { ScorePill } from './ScorePill';

function getInitials(title: string) {
  return title.split(' ').slice(0, 2).map((word) => word[0]).join('');
}

export function AnimeCard({ anime }: { anime: Anime }) {
  return (
    <article className="anime-card group stack-animate">
      <div className="anime-card-poster aspect-[4/4.8]" style={{ backgroundColor: anime.accentColor }}>
        <div className="poster-overlay absolute inset-0" />
        <div className="poster-gloss absolute inset-x-0 top-0 h-24" />
        <div className="relative flex h-full items-center justify-center text-4xl font-semibold tracking-[0.22em] text-[--color-text] transition-transform duration-500 group-hover:scale-105">{getInitials(anime.title)}</div>
        <div className="absolute left-3 top-3"><Badge status={anime.status} /></div>
        <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow-soft tracking-[0.32em]">Studio</p>
            <p className="mt-2 text-sm text-[--color-text]">{anime.studio}</p>
          </div>
          <ScorePill score={anime.score} />
        </div>
        <div className="accent-divider absolute bottom-0 h-0.75 w-full" />
      </div>
      <div className="anime-card-body">
        <div>
          <p className="eyebrow">{anime.genres[0]}</p>
          <h3 className="mt-2 text-base font-medium leading-6 text-[--color-text]">{anime.title}</h3>
          <p className="text-sm text-[--color-text-soft]">{anime.year} · {anime.episodes} eps</p>
        </div>
        <span className="action-pill">Open</span>
      </div>
    </article>
  );
}
