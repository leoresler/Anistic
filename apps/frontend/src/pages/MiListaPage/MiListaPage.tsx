import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";

import { AnimeCard } from "../../components/AnimeCard";
import { SkeletonCard } from "../../components/SkeletonCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { animeApi, type UserAnimeListStatus } from "../../lib/api";

type GuardadosFilter = "all" | UserAnimeListStatus;

const filters: { label: string; value: GuardadosFilter }[] = [
  { label: "Todos", value: "all" },
  { label: "Viendo", value: "watching" },
  { label: "Completados", value: "completed" },
  { label: "Pendientes", value: "pending" },
];

const statusLabel: Record<UserAnimeListStatus, string> = {
  watching: "Viendo",
  completed: "Completados",
  pending: "Pendientes",
};

export const MiListaPage = () => {
  useDocumentTitle("Guardados — Anistic");
  const [activeFilter, setActiveFilter] = useState<GuardadosFilter>("all");
  const listsQuery = useQuery({ queryKey: ["anime-lists"], queryFn: () => animeApi.lists() });

  const items = listsQuery.data ?? [];
  const counts = useMemo(
    () => ({
      all: items.length,
      watching: items.filter((item) => item.list.status === "watching").length,
      completed: items.filter((item) => item.list.status === "completed").length,
      pending: items.filter((item) => item.list.status === "pending").length,
    }),
    [items],
  );

  const filteredItems = activeFilter === "all" ? items : items.filter((item) => item.list.status === activeFilter);
  const isEmpty = !listsQuery.isLoading && items.length === 0;
  const isFilteredEmpty = !listsQuery.isLoading && items.length > 0 && filteredItems.length === 0;

  return (
    <main className="min-h-screen px-5 py-6 text-cream-primary sm:px-8 lg:px-10">
      <section className="relative z-10 mx-auto max-w-[1600px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bookmark size={18} className="text-sabio-light" />
            <p className="text-sm font-black text-cream-primary">Guardados</p>
            <span className="text-sm font-bold text-cream-secondary">{counts.all} animes</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => {
              const active = activeFilter === filter.value;
              const count = counts[filter.value];
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-black transition ${
                    active
                      ? "bg-sabio text-anime-main"
                      : "border border-anime-border bg-anime-input text-cream-secondary hover:border-sabio-dim hover:text-cream-primary"
                  }`}
                >
                  {filter.label} <span className="opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          {listsQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from({ length: 12 }, (_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : isEmpty ? (
            <EmptyState
              icon={<Bookmark size={32} />}
              title="Todavía no guardaste animes"
              description="Agregá animes a Viendo, Completados o Pendientes desde la ficha de cada anime."
              action={
                <Link
                  to="/explorar"
                  className="rounded-full bg-sabio px-6 py-3 font-black text-anime-main transition hover:bg-sabio-light"
                >
                  Explorar animes
                </Link>
              }
            />
          ) : isFilteredEmpty ? (
            <EmptyState
              title={`No tenés animes en ${activeFilter === "all" ? "Guardados" : statusLabel[activeFilter]}`}
              description="Probá otro filtro o guardá más animes desde Explorar."
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filteredItems.map((item) => (
                <AnimeCard key={item.list.id} anime={item.anime} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};
