import { Star } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { eventsApi, type Anime, type AnimeSummary } from "../../../lib/api";

type AnimePosterCardProps = {
  anime: Anime | AnimeSummary;
};

export const AnimePosterCard = ({ anime }: AnimePosterCardProps) => {
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
  const episodesLabel = anime.episodes ? `${anime.episodes} eps` : null;

  return (
    <Link
      to={`/anime/${anime.malId}`}
      onClick={() => void eventsApi.track({ eventType: "card_clicked", animeId: anime.id }).catch(() => undefined)}
      className="group block w-36 shrink-0 snap-start sm:w-40 lg:w-40 xl:w-44"
    >
      <article className="transition duration-300 ease-out hover:-translate-y-1">
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-anime-border bg-anime-input">
          {hasImage ? (
            <img
              src={anime.imageUrl!}
              alt={anime.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-sabio-dim/30 text-2xl font-black text-cream-primary sm:text-3xl">
              {initials}
            </div>
          )}

          <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-sabio px-2 py-0.5 text-xs font-black text-anime-main">
            <Star size={11} fill="currentColor" /> {anime.score ?? "-"}
          </div>
        </div>

        <div className="mt-2.5">
          <h3 className="line-clamp-2 text-sm font-black leading-tight tracking-[-0.02em] text-cream-primary transition group-hover:text-sabio-light sm:text-base">
            {anime.title}
          </h3>
          <p className="mt-1 text-xs font-semibold text-cream-secondary">
            {anime.year ?? "Sin año"}
            {episodesLabel ? ` · ${episodesLabel}` : null}
          </p>
        </div>
      </article>
    </Link>
  );
};
