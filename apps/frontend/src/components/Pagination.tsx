import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const visiblePages = (page: number, totalPages: number) => {
  const pages: Array<number | "ellipsis-left" | "ellipsis-right"> = [];

  for (let current = 1; current <= totalPages; current += 1) {
    if (current === 1 || current === totalPages || Math.abs(current - page) <= 1) {
      pages.push(current);
    } else if (current < page && !pages.includes("ellipsis-left")) {
      pages.push("ellipsis-left");
    } else if (current > page && !pages.includes("ellipsis-right")) {
      pages.push("ellipsis-right");
    }
  }

  return pages;
};

export const Pagination = ({ page, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Paginación">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-anime-border bg-anime-surface font-black text-cream-primary transition hover:border-sabio-dim hover:bg-anime-input disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Página anterior"
      >
        <ChevronLeft size={18} />
      </button>
      {visiblePages(page, totalPages).map((item) =>
        typeof item === "number" ? (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            className={`h-11 min-w-11 rounded-full px-4 text-sm font-black transition ${
              item === page
                ? "bg-sabio text-anime-main"
                : "border border-anime-border bg-anime-surface text-cream-primary hover:border-sabio-dim hover:bg-anime-input"
            }`}
          >
            {item}
          </button>
        ) : (
          <span key={item} className="px-2 text-cream-secondary">
            ...
          </span>
        ),
      )}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-anime-border bg-anime-surface font-black text-cream-primary transition hover:border-sabio-dim hover:bg-anime-input disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Página siguiente"
      >
        <ChevronRight size={18} />
      </button>
    </nav>
  );
};
