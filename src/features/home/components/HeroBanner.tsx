import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { ScorePill } from '../../../shared/components/ScorePill';
import { animeData, featuredAnime } from '../../../shared/mocks/animeData';

export function HeroBanner() {
  const heroSlides = useMemo(() => [featuredAnime, ...animeData.filter((anime) => anime.id !== featuredAnime.id).slice(0, 5)], []);
  const [activeSlide, setActiveSlide] = useState(0);
  const [autoplayPaused, setAutoplayPaused] = useState(false);

  useEffect(() => {
    if (autoplayPaused) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current === heroSlides.length - 1 ? 0 : current + 1));
    }, 6500);

    return () => {
      window.clearInterval(interval);
    };
  }, [autoplayPaused, heroSlides.length]);

  const goToSlide = (direction: 'prev' | 'next') => {
    setActiveSlide((current) => {
      if (direction === 'prev') {
        return current === 0 ? heroSlides.length - 1 : current - 1;
      }

      return current === heroSlides.length - 1 ? 0 : current + 1;
    });
  };

  return (
    <section className="hero-stage stack-animate">
      <div className="hero-stage-header">
        <div>
          <p className="section-kicker">Featured premiere</p>
          <h2 className="hero-stage-title">Editorial spotlight</h2>
        </div>

        <div className="hero-carousel-controls">
          <button type="button" className="carousel-control" aria-label="Previous spotlight" onClick={() => goToSlide('prev')}>
            ←
          </button>
          <button type="button" className="carousel-control" aria-label="Next spotlight" onClick={() => goToSlide('next')}>
            →
          </button>
        </div>
      </div>

      <div
        className="hero-stage-viewport"
        onMouseEnter={() => setAutoplayPaused(true)}
        onMouseLeave={() => setAutoplayPaused(false)}
        onFocus={() => setAutoplayPaused(true)}
        onBlur={() => setAutoplayPaused(false)}
      >
        <div className="hero-stage-track" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
          {heroSlides.map((anime, index) => (
            <div key={anime.id} className={index === activeSlide ? 'hero-stage-slide hero-stage-slide-active' : 'hero-stage-slide hero-stage-slide-inactive'}>
              <div className={index === activeSlide ? 'hero-copy hero-copy-active' : 'hero-copy hero-copy-inactive'} style={{ animationDelay: `${80 + index * 30}ms` }}>
                <div className="space-y-4">
                  <p className="section-kicker">{anime.status === 'airing' ? 'Now airing' : 'Featured selection'}</p>
                  <h1 className="hero-headline">{anime.title} framed with a cleaner, sharper modern glow.</h1>
                  <p className="hero-text">{anime.title} leads the experience with a freer editorial layout: stronger hierarchy, quieter surfaces, and compact modules that feel curated instead of boxed in.</p>
                </div>

                <div className="hero-meta">
                  <Badge status={anime.status} />
                  <ScorePill score={anime.score} />
                  <span className="text-sm text-[--color-text-soft]">{anime.year} • {anime.episodes} eps • {anime.studio}</span>
                </div>

                <div className="hero-cta-row">
                  <Button>Watch Preview</Button>
                  <Link to={`/${anime.id}`}><Button variant="outline">View Detail</Button></Link>
                </div>

                <div className="editorial-note-grid">
                  <div>
                    <p className="eyebrow">Direction</p>
                    <p className="hero-note-copy">Typography sits in open space while the featured module rotates as the visual anchor.</p>
                  </div>
                  <div>
                    <p className="eyebrow">Palette</p>
                    <p className="hero-note-copy">Gray leads, warm accents focus the eye, and cooler hints keep the interface current.</p>
                  </div>
                  <div>
                    <p className="eyebrow">Motion</p>
                    <p className="hero-note-copy">Carousel transitions keep the hero alive without adding noisy visual clutter.</p>
                  </div>
                </div>
              </div>

              <div className={index === activeSlide ? 'hero-side hero-side-active' : 'hero-side hero-side-inactive'}>
                <article className="spotlight-card">
                  <div className="spotlight-poster" style={{ backgroundColor: anime.accentColor }}>
                    <div className="spotlight-overlay" />
                    <div className="spotlight-topline">
                      <span className="glass-chip">Spotlight</span>
                      <span className="glass-chip-wide">{anime.genres.join(' • ')}</span>
                    </div>

                    <div className="spotlight-content-card">
                      <p className="eyebrow">Now trending</p>
                      <h2 className="spotlight-title">{anime.title}</h2>
                      <p className="spotlight-copy">A more cinematic focal module with a borderless visual field, cleaner metadata, and a compact content surface.</p>
                      <div className="spotlight-stats">
                        <span>{anime.studio}</span>
                        <span>{anime.episodes} eps</span>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hero-carousel-dots" aria-label="Spotlight pagination">
        {heroSlides.map((anime, index) => (
          <button
            key={anime.id}
            type="button"
            className={index === activeSlide ? 'hero-carousel-dot hero-carousel-dot-active' : 'hero-carousel-dot'}
            aria-label={`Go to ${anime.title}`}
            onClick={() => setActiveSlide(index)}
          >
            <span className={index === activeSlide && !autoplayPaused ? 'hero-carousel-dot-progress hero-carousel-dot-progress-active' : 'hero-carousel-dot-progress'} />
          </button>
        ))}
      </div>
    </section>
  );
}
