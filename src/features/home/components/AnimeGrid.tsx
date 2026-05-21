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
        <p className="section-caption hidden md:block">Anime cards keep the visual field open and move the dense info into a tighter surface below.</p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {animeData.slice(0, 12).map((anime) => <Link key={anime.id} to={`/${anime.id}`}><AnimeCard anime={anime} /></Link>)}
      </div>
    </section>
  );
}
