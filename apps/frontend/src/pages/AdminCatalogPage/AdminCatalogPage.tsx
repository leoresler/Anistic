import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import { PageHeader } from "../../components/ui/PageHeader";
import { SearchInput } from "../../components/SearchInput";
import { Pagination } from "../../components/Pagination";
import { EmptyState } from "../../components/ui/EmptyState";
import { SingleSelect } from "../../components/SingleSelect";
import { animeApi } from "../../lib/api";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { AdminStatsBar } from "./components/AdminStatsBar";
import { AdminAnimeTable } from "./components/AdminAnimeTable";

const visibilityOptions = [
  { value: "all", label: "Todos" },
  { value: "visible", label: "Visibles" },
  { value: "hidden", label: "Ocultos" },
];

const sortOptions = [
  { value: "popularity", label: "Popularidad" },
  { value: "score", label: "Puntuación" },
  { value: "year", label: "Año" },
  { value: "rank", label: "Rank" },
  { value: "hidden", label: "Oculto" },
];

const orderOptions = [
  { value: "desc", label: "Descendente" },
  { value: "asc", label: "Ascendente" },
];

export const AdminCatalogPage = () => {
  useDocumentTitle("Catálogo (Admin) — Anistic");
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const tableRef = useRef<HTMLDivElement>(null);

  const params = useMemo(() => {
    const next = new URLSearchParams(searchParams);
    if (!next.has("page")) next.set("page", "1");
    if (!next.has("limit")) next.set("limit", "24");
    return next;
  }, [searchParams]);

  const page = Number(params.get("page") ?? 1);
  const search = params.get("search") ?? "";
  const visibility = params.get("visibility") ?? "all";
  const sort = params.get("sort") ?? "popularity";
  const order = params.get("order") ?? "desc";

  const animesQuery = useQuery({
    queryKey: ["admin-animes", { page, search, visibility, sort, order }],
    queryFn: () => animeApi.listAdminAnimes(params),
  });

  const statsQuery = useQuery({
    queryKey: ["admin-anime-stats"],
    queryFn: () => animeApi.getAdminAnimeStats(),
  });

  useEffect(() => {
    if (animesQuery.isError) {
      toast.error("Error al cargar el catálogo");
    }
  }, [animesQuery.isError]);

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

  const changePage = useCallback(
    (nextPage: number) => {
      setParam("page", String(nextPage));
      window.setTimeout(() => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    },
    [setParam],
  );

  const toggleMutation = useMutation({
    mutationFn: ({ id, hidden }: { id: number; hidden: boolean }) =>
      animeApi.setVisibility(id, { hidden, reason: hidden ? "manual" : undefined }),
    onSuccess: () => {
      toast.success("Visibilidad actualizada");
      void queryClient.invalidateQueries({ queryKey: ["admin-animes"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-anime-stats"] });
    },
    onError: () => {
      toast.error("Error al actualizar visibilidad");
    },
  });

  const handleToggle = useCallback(
    (id: number, currentHidden: boolean) => {
      toggleMutation.mutate({ id, hidden: !currentHidden });
    },
    [toggleMutation],
  );

  const data = animesQuery.data;
  const isLoading = animesQuery.isLoading || animesQuery.isFetching;
  const hasResults = !isLoading && data !== undefined && data.data.length > 0;
  const hasNoResults = !isLoading && data !== undefined && data.data.length === 0;

  return (
    <main className="min-h-screen text-cream-primary">
      <section className="relative z-10 mx-auto max-w-[1600px] px-5 py-6 sm:px-8 lg:px-10">
        <PageHeader title="Catálogo (Admin)" />

        <div className="mt-6">
          <AdminStatsBar stats={statsQuery.data} />
        </div>

        <div ref={tableRef} className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:max-w-md">
            <SearchInput
              value={search}
              onChange={(value) => setParam("search", value)}
              placeholder="Buscar por título"
              compact
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SingleSelect
              label="Visibilidad"
              options={visibilityOptions}
              currentValue={visibility}
              onChange={(value) => setParam("visibility", value)}
            />

            <SingleSelect
              label="Ordenar"
              options={sortOptions}
              currentValue={sort}
              onChange={(value) => setParam("sort", value)}
            />

            <SingleSelect
              label="Dirección"
              options={orderOptions}
              currentValue={order}
              onChange={(value) => setParam("order", value)}
            />
          </div>
        </div>

        <section className="mt-5 min-w-0">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, index) => (
                <div
                  key={index}
                  className="h-14 animate-pulse rounded-2xl border border-anime-border bg-anime-surface/50"
                />
              ))}
            </div>
          ) : hasResults ? (
            <>
              <AdminAnimeTable animes={data.data} onToggle={handleToggle} />
              <div className="mt-8">
                <Pagination page={page} totalPages={data.pagination.totalPages} onPageChange={changePage} />
              </div>
            </>
          ) : hasNoResults ? (
            <EmptyState
              title="No se encontraron animes"
              description="No se encontraron animes con los filtros seleccionados."
            />
          ) : null}
        </section>
      </section>
    </main>
  );
};
