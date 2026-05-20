import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Explore', href: '/explore' },
  { label: 'My List', href: '/my-list' },
];

export function NavBar() {
  const { pathname } = useLocation();

  return (
    <header className="panel sticky top-4 z-20 flex min-h-16 items-center justify-between gap-3 px-4 py-3 md:px-6">
      <Link to="/" className="min-w-0 flex-1 flex-col leading-none text-[--color-text] sm:flex-none">
        <span className="text-[10px] uppercase tracking-[0.42em] text-[--color-text-muted]">Nocturne catalog</span>
        <span className="mt-2 block truncate text-lg font-semibold tracking-[-0.04em] sm:text-xl">Anime Em<span className="text-[--color-gold]">ber</span></span>
      </Link>
      <nav className="hidden items-center gap-2 md:flex">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return <Link key={item.href} to={item.href} className={active ? 'nav-pill-active' : 'nav-pill'}>{item.label}</Link>;
        })}
      </nav>
      <button className="nav-pill-active inline-flex h-10 w-10 items-center justify-center px-0 md:hidden">☰</button>
    </header>
  );
}
