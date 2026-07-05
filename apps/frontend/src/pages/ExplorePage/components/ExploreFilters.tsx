import { useQuery } from "@tanstack/react-query";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { SingleSelect } from "../../../components/SingleSelect";
import { animeApi } from "../../../lib/api";

const statusOptions = [
  { label: "En emisión", value: "Airing" },
  { label: "Finalizado", value: "Finished Airing" },
];

const seasonOptions = [
  { label: "Invierno", value: "winter" },
  { label: "Primavera", value: "spring" },
  { label: "Verano", value: "summer" },
  { label: "Otoño", value: "fall" },
];

const sortOptions = [
  { label: "Relevancia", value: "relevance" },
  { label: "Puntuación", value: "score" },
  { label: "Popularidad", value: "popularity" },
  { label: "Año", value: "year" },
  { label: "Ranking", value: "rank" },
];

const formatOptions = [
  { label: "Serie", value: "TV" },
  { label: "Película", value: "MOVIE" },
  { label: "OVA", value: "OVA" },
  { label: "ONA", value: "ONA" },
  { label: "Especial", value: "SPECIAL" },
];

const orderOptions = [
  { label: "Descendente", value: "desc" },
  { label: "Ascendente", value: "asc" },
];

export const genreValues = (params: URLSearchParams) =>
  params.getAll("genre").flatMap((genre) => genre.split(",").filter(Boolean));

type MultiSelectProps = {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
};

const MultiSelect = ({ label, options, selected, onToggle }: MultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const active = selected.length > 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((c) => !c)}
        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black transition ${
          active
            ? "bg-sabio text-anime-main"
            : "border border-anime-border bg-anime-input text-cream-secondary hover:border-sabio-dim hover:text-cream-primary"
        }`}
      >
        {label}
        {selected.length > 0 && <span className="text-[10px]">({selected.length})</span>}
        <ChevronDown size={12} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-30 mt-2 max-h-64 w-56 overflow-auto rounded-2xl border border-anime-border bg-anime-surface/95 p-2 shadow-2xl shadow-black/40 backdrop-blur">
          {options.map((option) => {
            const isSelected = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => onToggle(option)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold transition ${
                  isSelected ? "bg-sabio/20 text-sabio-light" : "text-cream-primary hover:bg-anime-input"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                    isSelected ? "border-sabio bg-sabio text-anime-main" : "border-anime-border bg-anime-input"
                  }`}
                >
                  {isSelected ? "✓" : ""}
                </span>
                {option}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

type ExploreFiltersProps = {
  genres: string[];
  years: number[];
  params: URLSearchParams;
  onSetParam: (key: string, value: string) => void;
  onToggleGenre: (genre: string) => void;
  onClear: () => void;
};

export const ExploreFilters = ({
  genres,
  years,
  params,
  onSetParam,
  onToggleGenre,
  onClear,
}: ExploreFiltersProps) => {
  const selectedGenres = genreValues(params);
  const currentStatus = params.get("status") ?? "";
  const currentSeason = params.get("season") ?? "";
  const currentYear = params.get("year") ?? "";
  const currentSort = params.get("sort") ?? "relevance";
  const currentOrder = params.get("order") ?? "desc";
  const currentFormat = params.get("format") ?? "";
  const currentStudio = params.get("studio") ?? "";
  const hasActiveFilters =
    selectedGenres.length > 0 ||
    currentStatus ||
    currentSeason ||
    currentYear ||
    currentFormat ||
    currentStudio ||
    currentSort !== "relevance" ||
    currentOrder !== "desc";

  const yearOptions = years.slice(0, 12).map((y) => ({ label: String(y), value: String(y) }));
  const studiosQuery = useQuery({ queryKey: ["anime-studios"], queryFn: animeApi.studios });
  const studioOptions =
    studiosQuery.data?.studios.map((s) => ({ label: `${s.studio} (${s.count})`, value: s.studio })) ?? [];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <MultiSelect label="Género" options={genres} selected={selectedGenres} onToggle={onToggleGenre} />

      <SingleSelect
        label="Estado"
        options={statusOptions}
        allLabel="Todos"
        currentValue={currentStatus}
        onChange={(v) => onSetParam("status", v)}
      />

      <SingleSelect
        label="Temporada"
        options={seasonOptions}
        allLabel="Todas"
        currentValue={currentSeason}
        onChange={(v) => onSetParam("season", v)}
      />

      <SingleSelect
        label="Año"
        options={yearOptions}
        allLabel="Todos"
        currentValue={currentYear}
        onChange={(v) => onSetParam("year", v)}
      />

      <SingleSelect
        label="Formato"
        options={formatOptions}
        allLabel="Todos"
        currentValue={currentFormat}
        onChange={(v) => onSetParam("format", v)}
      />

      <SingleSelect
        label="Estudio"
        options={studioOptions}
        allLabel="Todos"
        currentValue={currentStudio}
        onChange={(v) => onSetParam("studio", v)}
      />

      <SingleSelect
        label="Ordenar"
        options={sortOptions}
        allLabel="Relevancia"
        currentValue={currentSort}
        onChange={(v) => onSetParam("sort", v)}
      />

      <SingleSelect
        label="Dirección"
        options={orderOptions}
        currentValue={currentOrder}
        onChange={(v) => onSetParam("order", v)}
      />

      {hasActiveFilters ? (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-sabio-light transition hover:text-sabio"
        >
          <X size={12} /> Limpiar
        </button>
      ) : null}
    </div>
  );
};

type ExploreFilterDrawerProps = ExploreFiltersProps & {
  open: boolean;
  onClose: () => void;
};

export const ExploreFilterDrawer = ({ open, onClose, ...filtersProps }: ExploreFilterDrawerProps) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-anime-main/70"
        aria-label="Cerrar filtros"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 h-full w-[88vw] max-w-sm overflow-auto border-l border-anime-border bg-anime-surface p-6 shadow-2xl shadow-black/40">
        <button
          type="button"
          onClick={onClose}
          className="mb-6 inline-flex h-9 w-9 items-center justify-center rounded-full bg-anime-input text-cream-primary transition hover:border-sabio-dim"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
        <ExploreFilters {...filtersProps} />
      </aside>
    </div>
  );
};