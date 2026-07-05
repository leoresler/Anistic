import type { AdminAnime } from "@template/shared";

import { AdminAnimeRow } from "./AdminAnimeRow";

type AdminAnimeTableProps = {
  animes: AdminAnime[];
  onToggle: (id: number, currentHidden: boolean) => void;
};

export const AdminAnimeTable = ({ animes, onToggle }: AdminAnimeTableProps) => (
  <div className="overflow-x-auto rounded-3xl border border-anime-border bg-anime-surface/50">
    <table className="w-full min-w-[640px] text-left">
      <thead>
        <tr className="border-b border-anime-border text-[10px] font-black uppercase tracking-wider text-cream-secondary">
          <th className="py-3 pl-3 pr-2">Título</th>
          <th className="px-2 py-3">Año</th>
          <th className="px-2 py-3">Estado</th>
          <th className="px-2 py-3">Oculto</th>
          <th className="px-2 py-3">Motivo</th>
          <th className="py-3 pl-2 pr-3">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {animes.map((anime) => (
          <AdminAnimeRow key={anime.id} anime={anime} onToggle={onToggle} />
        ))}
      </tbody>
    </table>
  </div>
);
