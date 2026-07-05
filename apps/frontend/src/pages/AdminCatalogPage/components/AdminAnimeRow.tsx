import { Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";

import type { AdminAnime } from "@template/shared";

const statusLabel = (status: string | null) => {
  if (status === "Airing") return "En emisión";
  if (status === "Finished Airing") return "Finalizado";
  return status ?? "—";
};

const hiddenBadge = (hidden: boolean) => {
  if (hidden) {
    return <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-black text-red-400">Oculto</span>;
  }
  return <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-black text-green-400">Visible</span>;
};

const reasonBadge = (reason: string | null) => {
  if (!reason) return null;
  if (reason === "manual") {
    return <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-black text-orange-400">Manual</span>;
  }
  if (reason === "filtered_out_by_sync") {
    return (
      <span className="rounded-full bg-cream-secondary/15 px-2 py-0.5 text-[10px] font-black text-cream-secondary">
        Sync
      </span>
    );
  }
  return <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-black text-blue-400">{reason}</span>;
};

type AdminAnimeRowProps = {
  anime: AdminAnime;
  onToggle: (id: number, currentHidden: boolean) => void;
};

export const AdminAnimeRow = ({ anime, onToggle }: AdminAnimeRowProps) => {
  const hasImage = Boolean(anime.imageUrl);
  const initials = anime.title
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <tr className="border-b border-anime-border/50 transition hover:bg-anime-surface/40">
      <td className="py-3 pl-3 pr-2">
        <Link to={`/anime/${anime.malId}`} className="group flex items-center gap-3">
          <div className="relative h-10 w-8 shrink-0 overflow-hidden rounded-lg bg-anime-input">
            {hasImage ? (
              <img
                src={anime.imageUrl!}
                alt={anime.title}
                className="h-full w-full object-cover transition group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[8px] font-black text-cream-primary">
                {initials}
              </div>
            )}
          </div>
          <span className="line-clamp-2 text-sm font-bold text-cream-primary transition group-hover:text-sabio-light">
            {anime.title}
          </span>
        </Link>
      </td>
      <td className="px-2 py-3 text-sm font-semibold text-cream-secondary">{anime.year ?? "—"}</td>
      <td className="px-2 py-3 text-sm font-semibold text-cream-secondary">{statusLabel(anime.status)}</td>
      <td className="px-2 py-3">{hiddenBadge(anime.hidden)}</td>
      <td className="px-2 py-3">{reasonBadge(anime.hiddenReason)}</td>
      <td className="py-3 pl-2 pr-3">
        <button
          type="button"
          onClick={() => onToggle(anime.id, anime.hidden)}
          className="inline-flex items-center gap-1.5 rounded-full bg-anime-input px-3 py-1.5 text-xs font-black text-cream-primary transition hover:bg-sabio hover:text-anime-main"
          aria-label={anime.hidden ? "Mostrar anime" : "Ocultar anime"}
        >
          {anime.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
          {anime.hidden ? "Mostrar" : "Ocultar"}
        </button>
      </td>
    </tr>
  );
};
