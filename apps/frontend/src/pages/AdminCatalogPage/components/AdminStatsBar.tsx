import type { AdminAnimeStats } from "@template/shared";

type AdminStatsBarProps = {
  stats: AdminAnimeStats | undefined;
};

export const AdminStatsBar = ({ stats }: AdminStatsBarProps) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      <div className="rounded-2xl border border-anime-border bg-anime-surface/50 p-3 sm:p-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-cream-secondary">Total</p>
        <p className="mt-1 text-2xl font-black text-cream-primary sm:text-3xl">{stats.total}</p>
      </div>
      <div className="rounded-2xl border border-anime-border bg-anime-surface/50 p-3 sm:p-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-cream-secondary">Visible</p>
        <p className="mt-1 text-2xl font-black text-green-400 sm:text-3xl">{stats.visible}</p>
      </div>
      <div className="rounded-2xl border border-anime-border bg-anime-surface/50 p-3 sm:p-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-cream-secondary">Oculto</p>
        <p className="mt-1 text-2xl font-black text-red-400 sm:text-3xl">{stats.hidden}</p>
      </div>
    </div>
  );
};
