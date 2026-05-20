import { NavBar } from '../../shared/components/NavBar';
import { AnimeGrid } from './components/AnimeGrid';
import { HeroBanner } from './components/HeroBanner';
import { SeasonalRow } from './components/SeasonalRow';

export function HomePage() {
  return (
    <main className="page-shell">
      <div className="page-frame">
        <NavBar />
        <HeroBanner />
        <SeasonalRow />
        <AnimeGrid />
      </div>
    </main>
  );
}
