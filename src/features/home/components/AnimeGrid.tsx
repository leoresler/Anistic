import { Link } from 'react-router-dom';
import { AnimeCard } from '../../../shared/components/AnimeCard';
import { animeData } from '../../../shared/mocks/animeData';

export function AnimeGrid() {
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="section-kicker">Editor picks</p>
          <h2 className="section-heading">Fresh this week</h2>
        </div>
        <p className="text-sm text-[--color-text-soft]">Sequenced like a premium nocturnal carousel</p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {animeData.slice(0, 12).map((anime) => <Link key={anime.id} to={`/${anime.id}`}><AnimeCard anime={anime} /></Link>)}
      </div>
    </section>
  );
}
