export const SkeletonCard = () => (
  <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-anime-border bg-anime-surface">
    <div className="aspect-[3/4] w-full animate-pulse bg-anime-input" />
    <div className="flex flex-1 flex-col p-2.5">
      <div className="h-12 animate-pulse rounded bg-anime-input" />
      <div className="mt-auto h-3 w-1/2 animate-pulse rounded bg-anime-input pt-1.5" />
    </div>
  </div>
);