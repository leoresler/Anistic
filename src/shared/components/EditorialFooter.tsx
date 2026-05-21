import { Link } from 'react-router-dom';
import styles from './EditorialFooter.module.css';

const primaryLinks = [
  { label: 'Explore', href: '/explore' },
  { label: 'Recomendaciones IA', href: '/recomendaciones-ai' },
  { label: 'Watch Party', href: '/watch-party' },
];

const secondaryLinks = ['Curated nights', 'Watch rituals', 'Private rooms'];

export function EditorialFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.heroColumn}>
        <p className={styles.kicker}>Editorial closing note</p>
        <h2 className={styles.title}>Anistic keeps the night catalog close, social, and intentionally cinematic.</h2>
      </div>

      <div className={styles.linksColumn}>
        <div>
          <p className={styles.sectionLabel}>Navigate</p>
          <div className={styles.linkList}>
            {primaryLinks.map((link) => (
              <Link key={link.href} to={link.href} className={styles.navLink}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className={styles.sectionLabel}>Notes</p>
          <div className={styles.pillList}>
            {secondaryLinks.map((item) => (
              <span key={item} className={styles.pill}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.bottomRow}>
        <p className={styles.meta}>Static interface showcase — crafted for a premium anime product direction.</p>
        <p className={styles.meta}>Anistic © 2026</p>
      </div>
    </footer>
  );
}
