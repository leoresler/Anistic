import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { AnimeCard } from "../../components/AnimeCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { Pagination } from "../../components/Pagination";
import { SearchInput } from "../../components/SearchInput";
import { SkeletonCard } from "../../components/SkeletonCard";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { animeApi, eventsApi } from "../../lib/api";
import { ExploreFilterDrawer, ExploreFilters, genreValues } from "./components/ExploreFilters";

export const ExplorePage = () => {
  useDocumentTitle("Explorar — Anistic");
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const lastTrackedSearch = useRef("");

  const view = (searchParams.get("view") as "catalog" | "upcoming") ?? "catalog";

  const apiParams = useMemo(() => {
    const next = new URLSearchParams(searchParams);
    if (!next.has("page")) next.set("page", "1");
    if (!next.has("limit")) next.set("limit", "24");
    return next;
  }, [searchParams]);

  const switchTab = useCallback(
    (newView: "catalog" | "upcoming") => {
      setSearchParams({ view: newView, sort: "relevance", order: "desc" });
    },
    [setSearchParams],
  );

  useEffect(() => {
    const query = apiParams.get("search")?.trim() ?? "";
    if (!query || query === lastTrackedSearch.current) return;
    const timeout = window.setTimeout(() => {
      lastTrackedSearch.current = query;
      void eventsApi.track({ eventType: "search_performed", query }).catch(() => undefined);
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [apiParams]);

  const animesQuery = useQuery({
    queryKey: ["animes", apiParams.toString()],
    queryFn: () => animeApi.list(apiParams),
  });
  const genresQuery = useQuery({ queryKey: ["anime-genres"], queryFn: animeApi.genres });
  const statsQuery = useQuery({ queryKey: ["anime-stats"], queryFn: animeApi.stats });

  const setParam = useCallback(
    (key: string, value: string) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== "page") next.set("page", "1");
        return next;
      });
    },
    [setSearchParams],
  );

  const toggleGenre = useCallback(
    (genre: string) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        const selected = new Set(genreValues(next));
        if (selected.has(genre)) selected.delete(genre);
        else selected.add(genre);
        next.delete("genre");
        [...selected].forEach((value) => next.append("genre", value));
        next.set("page", "1");
        return next;
      });
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => setSearchParams(new URLSearchParams()), [setSearchParams]);

  const changePage = useCallback(
    (page: number) => {
      setParam("page", String(page));
      window.setTimeout(() => gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    },
    [setParam],
  );

  const data = animesQuery.data;
  const currentPage = Number(apiParams.get("page") ?? 1);
  const isLoading = animesQuery.isLoading || animesQuery.isFetching;
  const searchQuery = apiParams.get("search")?.trim();
  const hasResults = !isLoading && data !== undefined && data.data.length > 0;
  const hasNoResults = !isLoading && data !== undefined && data.data.length === 0;

  const filterProps = {
    genres: genresQuery.data?.genres ?? [],
    years: statsQuery.data?.years ?? [],
    params: apiParams,
    onSetParam: setParam,
    onToggleGenre: toggleGenre,
    onClear: clearFilters,
  };

  return (
    <main className="min-h-screen text-cream-primary">
      <section className="relative z-10 mx-auto max-w-[1600px] px-5 py-6 sm:px-8 lg:px-10">
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => switchTab("catalog")}
            className={`rounded-full px-4 py-1.5 text-sm font-black transition ${
              view === "catalog"
                ? "bg-sabio text-anime-main"
                : "border border-anime-border bg-anime-input text-cream-secondary hover:border-sabio-dim hover:text-cream-primary"
            }`}
          >
            Catálogo
          </button>
          <button
            type="button"
            onClick={() => switchTab("upcoming")}
            className={`rounded-full px-4 py-1.5 text-sm font-black transition ${
              view === "upcoming"
                ? "bg-sabio text-anime-main"
                : "border border-anime-border bg-anime-input text-cream-secondary hover:border-sabio-dim hover:text-cream-primary"
            }`}
          >
            Próximos
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-between">
          <div className="hidden lg:flex lg:flex-1 lg:flex-wrap lg:items-center lg:gap-2">
            <ExploreFilters {...filterProps} />
          </div>

          <div className="w-full lg:w-auto lg:min-w-70 lg:max-w-90">
            <SearchInput
              value={apiParams.get("search") ?? ""}
              onChange={(value) => setParam("search", value)}
              placeholder="Buscá por título o sinopsis"
              compact
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-anime-border bg-anime-surface px-4 py-2 text-sm font-bold text-cream-primary transition hover:border-sabio-dim lg:hidden"
        >
          Filtros
        </button>

        <section ref={gridRef} className="mt-5 min-w-0">
          <div className="mb-4 flex items-center justify-between">
            {searchQuery && hasResults ? (
              <p className="text-sm font-black text-cream-primary">
                Resultados para &ldquo;{searchQuery}&rdquo;
              </p>
            ) : (
              <p className="text-sm font-bold text-cream-secondary">
                {data?.pagination.total ?? 0} animes
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from({ length: 12 }, (_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : data?.data.length ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {data.data.map((anime) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
              </div>
              <div className="mt-10">
                <Pagination page={currentPage} totalPages={data.pagination.totalPages} onPageChange={changePage} />
              </div>
            </>
          ) : searchQuery && hasNoResults ? (
            <EmptyState
              title={`No encontramos resultados para "${searchQuery}"`}
              description="No hay animes que coincidan con tu búsqueda. Probá con otro término o revisá si escribiste correctamente."
              action={
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-full bg-sabio px-6 py-3 font-black text-anime-main transition hover:bg-sabio-light"
                >
                  Limpiar búsqueda
                </button>
              }
            />
          ) : (
            <EmptyState
              title="No encontramos animes"
              description="Probá con otra búsqueda o limpiá los filtros activos."
              action={
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-full bg-sabio px-6 py-3 font-black text-anime-main transition hover:bg-sabio-light"
                >
                  Limpiar búsqueda
                </button>
              }
            />
          )}
        </section>
      </section>

      <ExploreFilterDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} {...filterProps} />
    </main>
  );
};