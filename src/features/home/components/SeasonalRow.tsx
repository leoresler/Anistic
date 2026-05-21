import { animeData } from '../../../shared/mocks/animeData';

export function SeasonalRow() {
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
        <p className="section-kicker">Seasonal shelf</p>
        <h2 className="section-heading">Moodboard by genre</h2>
        </div>
        <p className="section-caption hidden md:block">Smaller modules, cleaner reading rhythm, zero oversized wrappers.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {animeData.slice(0, 3).map((anime) => (
          <article key={anime.id} className="shelf-card stack-animate">
            <div className="shelf-card-poster" style={{ backgroundColor: anime.accentColor }}>
              <div className="poster-overlay-soft absolute inset-0" />
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between">
                <span className="eyebrow-soft">{anime.genres[0]}</span>
                <span className="text-sm text-[--color-text]">{anime.year}</span>
              </div>
            </div>
            <div className="shelf-card-body">
              <h3 className="text-lg font-medium tracking-[-0.03em] text-[--color-text]">{anime.title}</h3>
              <p className="mt-2 body-copy">{anime.studio} in a calmer shelf treatment with more breathing room, better density, and softer emphasis.</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
