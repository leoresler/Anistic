import { Link } from "react-router-dom";

import type { UserAnimeList, UserAnimeListStatus } from "../../../lib/api";

type InicioSidebarProps = {
  lists?: Record<UserAnimeListStatus, UserAnimeList[]>;
};

const statLabels: Record<UserAnimeListStatus, string> = {
  watching: "Viendo",
  completed: "Completados",
  pending: "Pendientes",
};

export const InicioSidebar = ({ lists }: InicioSidebarProps) => {
  const stats: { key: UserAnimeListStatus; label: string; count: number }[] = lists
    ? (["watching", "completed", "pending"] as const).map((key) => ({
        key,
        label: statLabels[key],
        count: lists[key]?.length ?? 0,
      }))
    : [];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {stats.map((stat) => (
        <div
          key={stat.key}
          className="flex items-center gap-2 rounded-2xl border border-anime-border bg-anime-surface px-4 py-2.5"
        >
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cream-secondary">{stat.label}</p>
          <p className="text-lg font-black text-sabio-light">{stat.count}</p>
        </div>
      ))}

      <Link
        to="/perfil"
        className="text-sm font-bold text-sabio-light transition hover:text-sabio"
      >
        Ver todas las stats →
      </Link>
    </div>
  );
};