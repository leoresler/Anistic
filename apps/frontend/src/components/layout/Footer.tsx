import { Link } from "react-router-dom";

const appVersion =
  import.meta.env.VITE_APP_VERSION?.trim() ||
  (typeof process !== "undefined" && process.env.VITE_APP_VERSION?.trim()) ||
  "v0.1.0";

export const Footer = () => (
  <footer className="relative z-10 border-t border-anime-border bg-anime-surface/60 px-5 py-6 backdrop-blur">
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm font-bold text-cream-secondary sm:flex-row">
      <p>Anistic © 2025</p>
      <nav className="flex flex-wrap items-center justify-center gap-4" aria-label="Footer">
        <a href="#" className="transition hover:text-cream-primary">
          Acerca de
        </a>
        <Link to="/addons" className="transition hover:text-cream-primary">
          Addons
        </Link>
        <a href="#" className="transition hover:text-cream-primary">
          Privacidad
        </a>
      </nav>
      <p className="font-mono text-xs opacity-70">{appVersion}</p>
    </div>
  </footer>
);
