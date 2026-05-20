export function SkeletonCard() {
  return (
    <div className="card-shell rounded-[24px]">
      <div className="shimmer aspect-[2/3] bg-[--color-surface-2]" />
      <div className="space-y-2 border-t border-[--color-border] px-4 py-4">
        <div className="shimmer h-3 w-3/4 rounded-full bg-[--color-surface-2]" />
        <div className="shimmer h-3 w-1/2 rounded-full bg-[--color-surface-2]" />
      </div>
    </div>
  );
}
