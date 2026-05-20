import { Link } from 'react-router-dom';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { ScorePill } from '../../../shared/components/ScorePill';
import { featuredAnime } from '../../../shared/mocks/animeData';

export function HeroBanner() {
  return (
    <section className="panel relative grid gap-6 overflow-hidden p-4 sm:p-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(184,111,63,0.08),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(122,79,53,0.14),transparent_30%)]" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/6 to-transparent" />
      <div className="relative min-w-0 space-y-5 sm:space-y-6">
        <div className="space-y-3">
          <p className="section-kicker">Featured premiere</p>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.05em] text-[--color-text] sm:text-4xl md:text-5xl lg:text-6xl">Nocturnal stories framed with a warmer, cinematic glow.</h1>
          <p className="section-copy">{featuredAnime.title} leads the homepage with layered navy atmosphere, editorial spacing, and a premium static presentation that feels curated instead of assembled.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge status={featuredAnime.status} />
          <ScorePill score={featuredAnime.score} />
          <span className="min-w-0 text-sm text-[--color-text-soft]">{featuredAnime.year} • {featuredAnime.episodes} eps • {featuredAnime.studio}</span>
        </div>
        <div className="grid gap-3 text-sm text-[--color-text-soft] sm:grid-cols-2 lg:grid-cols-3">
          <div className="panel-soft p-4">
            <p className="eyebrow">Tone</p>
            <p className="mt-2 text-[--color-text]">Atmospheric ember haze with restrained golden light.</p>
          </div>
          <div className="panel-soft p-4">
            <p className="eyebrow">Focus</p>
            <p className="mt-2 text-[--color-text]">Sharper hierarchy, less slab-heavy gray, more layered depth.</p>
          </div>
          <div className="panel-soft p-4">
            <p className="eyebrow">Format</p>
            <p className="mt-2 text-[--color-text]">Visual-only composition, static by design, zero behavioral clutter.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button>Watch Preview</Button>
          <Link to={`/${featuredAnime.id}`}><Button variant="outline">View Detail</Button></Link>
        </div>
      </div>
      <div className="poster-hero min-w-0 min-h-[300px] sm:min-h-[340px]" style={{ backgroundColor: featuredAnime.accentColor }}>
        <div className="poster-overlay-hero absolute inset-0" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/12 to-transparent" />
        <div className="accent-divider absolute bottom-0 h-[3px] w-full" />
        <div className="absolute inset-4 flex flex-col justify-between sm:inset-6">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="glass-chip">Nocturne spotlight</div>
            <div className="glass-chip-wide max-w-full text-left">{featuredAnime.genres.join(' • ')}</div>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="max-w-sm min-w-0">
              <p className="eyebrow-soft text-[11px]">Now trending</p>
              <p className="mt-3 text-4xl font-bold tracking-[0.16em] text-[--color-text] sm:text-5xl">CO</p>
              <p className="mt-3 body-copy">A posterless hero that still feels lush because the composition does the heavy lifting.</p>
            </div>
            <div className="glass-panel max-w-full md:max-w-xs">
              <p className="eyebrow-soft">Featured frame</p>
              <p className="mt-2">A hero composed like a cover spread: deeper atmosphere, softer glow, and cleaner metadata contrast.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
