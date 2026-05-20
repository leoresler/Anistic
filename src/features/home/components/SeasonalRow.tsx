import { animeData } from '../../../shared/mocks/animeData';

export function SeasonalRow() {
  return (
    <section className="space-y-4">
      <div>
        <p className="section-kicker">Seasonal shelf</p>
        <h2 className="section-heading">Moodboard by genre</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {animeData.slice(0, 3).map((anime) => (
          <article key={anime.id} className="panel-soft overflow-hidden p-4">
            <div className="poster-frame mb-5 h-28 rounded-[20px] border border-[--color-border]" style={{ backgroundColor: anime.accentColor }}>
              <div className="poster-overlay-soft absolute inset-0" />
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between">
                <span className="eyebrow-soft">{anime.genres[0]}</span>
                <span className="text-sm text-[--color-text]">{anime.year}</span>
              </div>
            </div>
            <h3 className="text-lg font-medium tracking-[-0.03em] text-[--color-text]">{anime.title}</h3>
            <p className="mt-2 body-copy">{anime.studio} in a calmer shelf treatment with more breathing room and warmer contrast.</p>
          </article>
        ))}
      </div>
    </section>
  );
}
