import { NavBar } from '../../shared/components/NavBar';
import { SearchInput } from '../../shared/components/SearchInput';
import { AnimeGrid } from './components/AnimeGrid';
import { FilterBar } from './components/FilterBar';

export function ExplorePage() {
  return (
    <main className="page-shell">
      <div className="page-frame">
        <NavBar />
        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <FilterBar />
          <div className="panel space-y-4 p-5 md:p-6">
            <div>
              <p className="section-kicker">Search shell</p>
              <h1 className="section-heading">Explore with an editorial catalog rhythm</h1>
              <p className="section-copy">The search side now feels less like a form bucket and more like a premium browse surface with clearer hierarchy and softer light.</p>
            </div>
            <SearchInput />
          </div>
        </section>
        <AnimeGrid />
      </div>
    </main>
  );
}
