import { Link } from 'react-router-dom';
import { AnimeCard } from '../../../shared/components/AnimeCard';
import { animeData } from '../../../shared/mocks/animeData';

export function AnimeGrid() {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-kicker">Catalog spread</p>
          <h2 className="section-heading">A wider browse wall with quieter chrome</h2>
        </div>
        <p className="text-sm text-[--color-text-soft] sm:max-w-xs sm:text-right">Every card now sits inside the same nocturnal visual system.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">{animeData.map((anime) => <Link key={anime.id} to={`/${anime.id}`} className="min-w-0"><AnimeCard anime={anime} /></Link>)}</div>
    </section>
  );
}
