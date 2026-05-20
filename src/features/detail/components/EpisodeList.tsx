import type { Anime } from '../../../shared/mocks/animeData';
import { ProgressBar } from '../../../shared/components/ProgressBar';

export function EpisodeList({ anime }: { anime: Anime }) {
  const episodes = Array.from({ length: 5 }, (_, index) => ({ number: index + 1, title: `${anime.title} — Episode ${index + 1}`, progress: 20 * (index + 1) }));
  return (
    <section className="panel space-y-4 p-5">
      <div>
        <p className="section-kicker">Episode queue</p>
        <h2 className="section-heading">Recent episodes</h2>
      </div>
      <div className="space-y-3">
        {episodes.map((episode) => (
          <article key={episode.number} className="panel-soft p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium text-[--color-text]">{episode.title}</h3>
                <p className="text-xs text-[--color-text-soft]">24 min · Mock synopsis strip</p>
              </div>
              <span className="eyebrow text-xs tracking-[0.2em]">EP {episode.number}</span>
            </div>
            <ProgressBar value={episode.progress} />
          </article>
        ))}
      </div>
    </section>
  );
}
