import { Link } from 'react-router-dom';
import { AnimeCard } from '../../../shared/components/AnimeCard';
import { relatedAnime } from '../../../shared/mocks/animeData';

export function RelatedRow() {
  return (
    <section className="space-y-4">
      <div>
        <p className="section-kicker">Related titles</p>
        <h2 className="section-heading">You might also queue</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{relatedAnime.map((anime) => <Link key={anime.id} to={`/${anime.id}`}><AnimeCard anime={anime} /></Link>)}</div>
    </section>
  );
}
