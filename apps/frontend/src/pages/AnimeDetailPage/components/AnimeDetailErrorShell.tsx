import type { ReactNode } from "react";

export const AnimeDetailErrorShell = ({ children }: { children: ReactNode }) => (
  <main className="grain flex min-h-screen items-center justify-center bg-anime-main px-5 text-cream-primary">
    <div className="rounded-4xl border border-anime-border bg-anime-surface/90 p-8 text-center shadow-2xl shadow-black/35">
      {children}
    </div>
  </main>
);
