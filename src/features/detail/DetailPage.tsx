import { useParams } from 'react-router-dom';
import { NavBar } from '../../shared/components/NavBar';
import { animeData, detailFallbackAnime } from '../../shared/mocks/animeData';
import { EpisodeList } from './components/EpisodeList';
import { HeroStrip } from './components/HeroStrip';
import { RelatedRow } from './components/RelatedRow';

export function DetailPage() {
  const { id } = useParams();
  const anime = animeData.find((item) => String(item.id) === id) ?? detailFallbackAnime;

  return (
    <main className="page-shell">
      <div className="page-frame">
        <NavBar />
        <HeroStrip anime={anime} />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <EpisodeList anime={anime} />
          <section className="panel space-y-4 p-5 md:p-6">
            <div>
              <p className="section-kicker">Series notes</p>
              <h2 className="section-heading">Atmospheric metadata</h2>
              <p className="section-copy">Genres: {anime.genres.join(', ')}. This panel stays intentionally static to honor the visual-only constraint while still contributing to the premium layered layout.</p>
            </div>
            <div className="mt-6 space-y-3">
              <div className="panel-soft p-4">
                <p className="eyebrow tracking-[0.26em]">Studio cue</p>
                <p className="mt-2 text-sm text-[--color-text]">{anime.studio} framed with warmer contrast and gentler glass separation.</p>
              </div>
              <div className="panel-soft p-4">
                <p className="eyebrow tracking-[0.26em]">Format</p>
                <p className="mt-2 text-sm text-[--color-text]">{anime.episodes} episodes, {anime.year} release window, collector-style presentation.</p>
              </div>
            </div>
          </section>
        </div>
        <RelatedRow />
      </div>
    </main>
  );
}
