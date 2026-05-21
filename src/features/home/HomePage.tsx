import { NavBar } from '../../shared/components/NavBar';
import { EditorialFooter } from '../../shared/components/EditorialFooter';
import { HeroBanner } from './components/HeroBanner';
import { SeasonalRow } from './components/SeasonalRow';

export function HomePage() {
  return (
    <main className="page-shell">
      <div className="page-frame">
        <NavBar />
        <HeroBanner />
        <SeasonalRow />
        <EditorialFooter />
      </div>
    </main>
  );
}
