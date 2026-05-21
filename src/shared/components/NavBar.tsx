import { Fragment, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SearchInput } from './SearchInput';
import styles from './NavBar.module.css';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Explore', href: '/explore' },
  { label: 'My List', href: '/my-list' },
];

const moreItems = [
  {
    label: 'Recomendaciones IA',
    href: '/recomendaciones-ai',
    description: 'Pedile a la IA una vibra, un tono o una referencia y devolvé picks editoriales.',
  },
  {
    label: 'Watch Party',
    href: '/watch-party',
    description: 'Entrá a una sala con stage compartido, chat y presencia social para mirar en grupo.',
  },
];

export function NavBar() {
  const { pathname } = useLocation();
  const [scrollY, setScrollY] = useState(() => window.scrollY);
  const [lockedCompact, setLockedCompact] = useState(() => window.scrollY > 120);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const nextScrollY = window.scrollY;

      setScrollY(nextScrollY);
      setLockedCompact((current) => {
        if (nextScrollY <= 0) {
          return false;
        }

        if (nextScrollY > 120) {
          return true;
        }

        return current;
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  const navState = scrollY <= 0 ? 'expanded' : lockedCompact ? 'compact' : 'transitioning';
  const progress = useMemo(() => Math.min(scrollY / 168, 1), [scrollY]);
  const navStyle = { '--nav-progress': progress } as CSSProperties;

  return (
    <Fragment>
      <header className="nav-wrap" data-nav-state={navState} style={navStyle}>
        <div className="nav-shell">
          <div className="nav-main-row md:grid md:grid-cols-[minmax(12rem,1fr)_auto_minmax(18rem,1fr)] md:items-center">
            <button
              type="button"
              className="nav-icon-button md:hidden"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => {
                setMobileMenuOpen((current) => !current);
                setMobileSearchOpen(false);
              }}
            >
              ☰
            </button>

            <Link to="/" className="nav-brand md:min-w-0 md:flex-none">
              <span className="nav-brand-mark">Ani<span>stic</span></span>
            </Link>

            <nav className="nav-links hidden md:flex md:justify-center" aria-label="Primary">
              {navItems.map((item) => {
                const active = pathname === item.href;

                return (
                  <Link key={item.href} to={item.href} className={active ? 'nav-pill-active' : 'nav-pill'}>
                    {item.label}
                  </Link>
                );
              })}

              <div className={styles.moreWrap}>
                <button
                  type="button"
                  className={pathname === '/recomendaciones-ai' || pathname === '/watch-party' || moreOpen ? 'nav-pill-active' : 'nav-pill'}
                  aria-expanded={moreOpen}
                  aria-haspopup="menu"
                  onClick={() => setMoreOpen((current) => !current)}
                >
                  Más
                </button>

                <div className={moreOpen ? styles.morePanelOpen : styles.morePanel} role="menu">
                  {moreItems.map((item) => {
                    const active = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        role="menuitem"
                        className={active ? `${styles.moreLink} ${styles.moreLinkActive}` : styles.moreLink}
                        onClick={() => setMoreOpen(false)}
                      >
                        <span className={styles.moreLabel}>{item.label}</span>
                        <span className={styles.moreDescription}>{item.description}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </nav>

            <div className="nav-actions md:ml-0 md:justify-end">
              <div className="hidden md:block md:w-[min(28vw,21rem)]">
                <SearchInput />
              </div>

              <button
                type="button"
                className="nav-icon-button md:hidden"
                aria-label={mobileSearchOpen ? 'Close search' : 'Open search'}
                aria-expanded={mobileSearchOpen}
                onClick={() => {
                  setMobileSearchOpen((current) => !current);
                  setMobileMenuOpen(false);
                }}
              >
                ⌕
              </button>

              <button type="button" className="profile-trigger" aria-label="Open profile menu">
                <span className="profile-avatar" aria-hidden="true">A</span>
                <span className="hidden text-sm font-medium text-[--color-text] sm:inline">Profile</span>
                <span className="profile-chevron" aria-hidden="true">⌄</span>
              </button>
            </div>
          </div>

          <div className={mobileSearchOpen ? 'mobile-panel mobile-panel-open md:hidden' : 'mobile-panel md:hidden'}>
            <SearchInput mobile />
          </div>

          <div className={mobileMenuOpen ? 'mobile-panel mobile-panel-open md:hidden' : 'mobile-panel md:hidden'}>
            <nav className="mobile-nav-list" aria-label="Mobile navigation">
              {navItems.map((item) => {
                const active = pathname === item.href;

                return (
                  <Link key={item.href} to={item.href} className={active ? 'mobile-nav-link mobile-nav-link-active' : 'mobile-nav-link'}>
                    <span>{item.label}</span>
                    <span aria-hidden="true">↗</span>
                  </Link>
                );
              })}

              <div className={styles.mobileGroupLabel}>Más</div>
              {moreItems.map((item) => {
                const active = pathname === item.href;

                return (
                  <Link key={item.href} to={item.href} className={active ? 'mobile-nav-link mobile-nav-link-active' : 'mobile-nav-link'}>
                    <span>{item.label}</span>
                    <span aria-hidden="true">↗</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>
      <div aria-hidden="true" className="nav-spacer" />
    </Fragment>
  );
}
