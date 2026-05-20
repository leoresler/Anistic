const genres = ['Action', 'Drama', 'Fantasy', 'Sci-Fi', 'Romance', 'Mystery'];
const statuses = ['Airing', 'Completed', 'Movie', 'Plan'];

export function FilterBar() {
  return (
    <section className="panel-soft space-y-5 p-5">
      <div>
        <p className="section-kicker">Explore filters</p>
        <h2 className="section-heading">Browse by mood and status</h2>
        <p className="section-copy">Static facets presented as calm illuminated chips instead of flat gray pills.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {genres.map((genre, index) => <span key={genre} className={index === 0 ? 'chip-active' : 'chip'}>{genre}</span>)}
      </div>
      <div className="flex flex-wrap gap-2">
        {statuses.map((status, index) => <span key={status} className={index === 0 ? 'chip-selected' : 'chip'}>{status}</span>)}
      </div>
    </section>
  );
}
