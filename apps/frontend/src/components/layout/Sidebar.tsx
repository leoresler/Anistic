import { ArrowLeft, Bookmark, Compass, Home, LogOut, Puzzle, Settings, Shield, Sparkles, UserRound, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { useAuthStore } from "../../store/auth.store";
import { Avatar } from "../ui/Avatar";
import { Popover } from "../ui/Popover";

const navItems = [
  { to: "/inicio", label: "Inicio", icon: Home },
  { to: "/explorar", label: "Explorar", icon: Compass },
  { to: "/mi-lista", label: "Guardados", icon: Bookmark },
  { to: "/recomendaciones-ia", label: "IA", icon: Sparkles },
  { to: "/watch-party", label: "Watch Party", icon: Users },
];

const isNestedRoute = (pathname: string) => pathname.startsWith("/anime/") || pathname.startsWith("/watch/");

export const Sidebar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [avatarOpen, setAvatarOpen] = useState(false);

  useEffect(() => {
    setAvatarOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.name ?? user?.email ?? user?.phone ?? "Usuario";
  const displayEmail = user?.email ?? user?.phone ?? "";

  return (
    <aside
      className="fixed left-0 top-0 z-40 flex h-screen w-20 flex-col border-r border-anime-border bg-anime-surface/80 backdrop-blur"
      aria-label="Navegación principal"
    >
      <div className="flex h-20 shrink-0 items-center justify-center">
        <NavLink
          to="/inicio"
          className="flex flex-col items-center gap-1 transition hover:opacity-80"
          aria-label="Anistic"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-anime-border bg-anime-input text-lg font-black text-sabio-light">
            A
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-cream-secondary">Anistic</span>
        </NavLink>
      </div>

      <nav className="flex flex-1 flex-col items-center gap-2 overflow-y-auto px-2 py-4">
        {/* {isNestedRoute(pathname) ? (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-2 flex flex-col items-center gap-1 rounded-2xl p-2 text-xs font-bold text-cream-secondary transition hover:bg-anime-input hover:text-cream-primary"
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
            <span className="text-[10px]">Volver</span>
          </button>
        ) : null} */}

        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex w-full flex-col items-center gap-1 rounded-2xl px-2 py-3 text-[10px] font-black uppercase tracking-wider transition ${
                isActive
                  ? "bg-anime-input text-cream-primary"
                  : "text-cream-secondary hover:bg-anime-input/60 hover:text-cream-primary"
              }`.trim()
            }
          >
            <item.icon size={20} />
            <span className="text-center leading-tight">{item.label}</span>
          </NavLink>
        ))}

        {user?.isAdmin && (
          <div className="w-full border-t border-anime-border pt-2 mt-2">
            <NavLink
              to="/admin/catalog"
              className={({ isActive }) =>
                `flex w-full flex-col items-center gap-1 rounded-2xl px-2 py-3 text-[10px] font-black uppercase tracking-wider transition ${
                  isActive
                    ? "bg-anime-input text-cream-primary"
                    : "text-cream-secondary hover:bg-anime-input/60 hover:text-cream-primary"
                }`.trim()
              }
            >
              <Shield size={20} />
              <span className="text-center leading-tight">Admin</span>
            </NavLink>
          </div>
        )}
      </nav>

      <div className="flex h-20 shrink-0 items-center justify-center border-t border-anime-border">
        <Popover
          open={avatarOpen}
          onClose={() => setAvatarOpen(false)}
          side="right"
          align="end"
          trigger={
            <button
              type="button"
              onClick={() => setAvatarOpen((current) => !current)}
              className="rounded-full border border-anime-border bg-anime-input p-1 transition hover:border-anime-border hover:bg-anime-input/80"
              aria-haspopup="dialog"
              aria-expanded={avatarOpen}
              aria-label="Menú de usuario"
            >
              <Avatar name={displayName} imageUrl={user?.avatarUrl} size="md" />
            </button>
          }
        >
          <div className="px-3 py-2">
            <p className="font-black text-cream-primary">{displayName}</p>
            {displayEmail ? <p className="text-sm font-semibold text-cream-secondary">{displayEmail}</p> : null}
          </div>
          <div className="my-1 h-px bg-anime-border" />
          <PopoverLink to="/perfil" icon={<UserRound size={16} />} onClick={() => setAvatarOpen(false)}>
            Mi perfil
          </PopoverLink>
          <PopoverLink to="/configuracion" icon={<Settings size={16} />} onClick={() => setAvatarOpen(false)}>
            Configuración
          </PopoverLink>
          <PopoverLink to="/addons" icon={<Puzzle size={16} />} onClick={() => setAvatarOpen(false)}>
            Addons
          </PopoverLink>
          <div className="my-1 h-px bg-anime-border" />
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm font-bold text-cream-secondary transition hover:bg-anime-input hover:text-cream-primary"
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        </Popover>
      </div>
    </aside>
  );
};

const PopoverLink = ({
  to,
  children,
  icon,
  onClick,
}: {
  to: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
}) => (
  <NavLink
    to={to}
    onClick={onClick}
    className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold text-cream-secondary transition hover:bg-anime-input hover:text-cream-primary"
  >
    {icon} {children}
  </NavLink>
);
