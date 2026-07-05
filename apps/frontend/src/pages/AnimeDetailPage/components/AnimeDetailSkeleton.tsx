export const AnimeDetailSkeleton = () => (
  <main className="min-h-screen px-5 py-8 text-cream-primary">
    <section className="relative z-10 mx-auto max-w-6xl animate-pulse">
      <div className="h-48 rounded-2xl bg-anime-input" />

      <div className="mt-4 flex gap-4">
        <div className="h-48 w-32 rounded-xl bg-anime-input" />
        <div className="flex-1 space-y-2">
          <div className="h-7 w-2/3 rounded bg-anime-input" />
          <div className="h-4 w-1/3 rounded bg-anime-input" />
          <div className="h-4 w-1/2 rounded bg-anime-input" />
          <div className="h-4 w-1/4 rounded bg-anime-input" />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
        {Array.from({ length: 20 }).map((_, index) => (
          <div key={index} className="h-9 rounded-xl bg-anime-input" />
        ))}
      </div>
    </section>
  </main>
);
