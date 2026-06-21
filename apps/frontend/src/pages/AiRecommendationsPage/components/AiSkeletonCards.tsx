export const AiSkeletonCards = () => (
  <>
    {[0, 1, 2].map((item) => (
      <div key={item} className="min-h-72 rounded-2xl border border-anime-border bg-anime-surface p-4">
        <div className="h-5 w-2/3 animate-pulse rounded bg-anime-input" />
        <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-anime-input" />
        <div className="mt-4 flex gap-1">
          <div className="h-4 w-14 animate-pulse rounded-full bg-anime-input" />
          <div className="h-4 w-16 animate-pulse rounded-full bg-anime-input" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 animate-pulse rounded bg-anime-input" />
          <div className="h-3 animate-pulse rounded bg-anime-input" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-anime-input" />
        </div>
      </div>
    ))}
  </>
);
