import { Button } from '../../shared/components/Button';
import { NavBar } from '../../shared/components/NavBar';
import { ListTable } from './components/ListTable';

export function MyListPage() {
  return (
    <main className="page-shell">
      <div className="page-frame">
        <NavBar />
        <section className="panel flex flex-col justify-between gap-5 p-5 md:flex-row md:items-end md:p-6">
          <div>
            <p className="section-kicker">Collection shelf</p>
            <h1 className="section-heading text-3xl font-bold">My List</h1>
            <p className="section-copy">Static list view with more editorial hierarchy, warmer depth and a stronger sense of premium watch-tracking layout.</p>
          </div>
          <div className="flex gap-3"><Button variant="ghost">Sort: Score</Button><Button variant="outline">Export Look</Button></div>
        </section>
        <ListTable />
      </div>
    </main>
  );
}
