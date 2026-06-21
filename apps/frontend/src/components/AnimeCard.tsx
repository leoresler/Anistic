import { Star } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { eventsApi, type Anime, type AnimeSummary } from "../lib/api";

type AnimeCardProps = {
  anime: Anime | AnimeSummary;
};

export const AnimeCard = ({ anime }: AnimeCardProps) => {
  const [imageFailed, setImageFailed] = useState(false);

  const initials = useMemo(
    () =>
      anime.title
        .split(" ")
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase(),
    [anime.title],
  );

  const hasImage = Boolean(anime.imageUrl) && !imageFailed;

  return (
    <Link
      to={`/anime/${anime.malId}`}
      onClick={() => void eventsApi.track({ eventType: "card_clicked", animeId: anime.id }).catch(() => undefined)}
      className="group block"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-anime-border bg-anime-surface transition duration-300 hover:border-sabio-dim">
        <div className="relative aspect-3/4 w-full shrink-0 overflow-hidden bg-anime-input">
          {hasImage ? (
            <img
              src={anime.imageUrl!}
              alt={anime.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-sabio-dim/30 text-xl font-black text-cream-primary">
              {initials}
            </div>
          )}

          <div className="absolute right-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-sabio px-1.5 py-0.5 text-[10px] font-black text-anime-main">
            <Star size={9} fill="currentColor" /> {anime.score ?? "-"}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-2.5">
          <h3 className="line-clamp-3 text-xs font-black leading-tight tracking-[-0.02em] text-cream-primary transition group-hover:text-sabio-light" style={{ minHeight: "3rem" }}>
            {anime.title}
          </h3>
          <p className="mt-auto pt-1.5 text-[10px] font-semibold text-cream-secondary">
            {anime.year ?? "—"}{anime.episodes ? ` · ${anime.episodes} eps` : ""}
          </p>
        </div>
      </article>
    </Link>
  );
};