import { Play } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import type { ContinueWatchingItem } from "../../../lib/api";

type ContinueWatchingCardProps = {
  item: ContinueWatchingItem;
};

export const ContinueWatchingCard = ({ item }: ContinueWatchingCardProps) => {
  const { anime, progress } = item;
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
  const progressPercent =
    progress.durationSeconds > 0 ? Math.round((progress.progressSeconds / progress.durationSeconds) * 100) : 0;

  return (
    <Link
      to={`/watch/${anime.malId}?season=${progress.season}&episode=${progress.episode}`}
      className="group block w-64 shrink-0 snap-start sm:w-72"
    >
      <article className="flex h-[120px] gap-3 rounded-2xl border border-anime-border bg-anime-surface p-2 transition duration-300 ease-out hover:-translate-y-1 hover:border-sabio-dim">
        <div className="relative h-[104px] w-[80px] shrink-0 overflow-hidden rounded-xl bg-anime-input">
          {hasImage ? (
            <img
              src={anime.imageUrl!}
              alt={anime.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-sabio-dim/30 text-lg font-black text-cream-primary">
              {initials}
            </div>
          )}

          <span className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-sabio text-anime-main shadow-sm transition group-hover:scale-110">
            <Play size={12} fill="currentColor" />
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center py-1">
          <h3 className="line-clamp-2 text-sm font-black leading-tight tracking-[-0.02em] text-cream-primary">
            {anime.title}
          </h3>
          <p className="mt-1 text-xs font-bold text-sabio-light">
            T{progress.season} · E{progress.episode}
          </p>

          {progress.durationSeconds > 0 ? (
            <div className="mt-3">
              <div className="h-1 w-full overflow-hidden rounded-full bg-anime-input">
                <div
                  className="h-full rounded-full bg-sabio transition-all"
                  style={{ width: `${Math.min(100, progressPercent)}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] font-semibold text-cream-secondary">
                {progressPercent}% visto
              </p>
            </div>
          ) : null}
        </div>
      </article>
    </Link>
  );
};
