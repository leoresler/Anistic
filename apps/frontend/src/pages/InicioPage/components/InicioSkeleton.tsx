const PosterSkeleton = () => (
  <div className="w-36 shrink-0 sm:w-40 lg:w-44">
    <div className="aspect-[3/4] animate-pulse rounded-2xl bg-anime-input" />
    <div className="mt-2.5 space-y-2">
      <div className="h-4 animate-pulse rounded-full bg-anime-input" />
      <div className="h-3 w-2/3 animate-pulse rounded-full bg-anime-input" />
    </div>
  </div>
);

const RowSkeleton = () => (
  <div>
    <div className="h-6 w-48 animate-pulse rounded-full bg-anime-input" />
    <div className="mt-4 flex gap-4">
      <PosterSkeleton />
      <PosterSkeleton />
      <PosterSkeleton />
      <PosterSkeleton />
      <PosterSkeleton />
      <PosterSkeleton />
    </div>
  </div>
);

export const InicioSkeleton = () => (
  <div className="space-y-12">
    <RowSkeleton />
    <RowSkeleton />
    <RowSkeleton />
  </div>
);
