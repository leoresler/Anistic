import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

type CarouselRowProps = {
  title: string;
  subtitle?: string;
  linkTo?: string;
  linkLabel?: string;
  children: ReactNode;
  className?: string;
};

export const CarouselRow = ({ title, subtitle, linkTo, linkLabel = "Ver todos", children, className }: CarouselRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 1);
    setCanScrollRight(container.scrollLeft + container.clientWidth < container.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return undefined;

    updateScrollState();
    container.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState, { passive: true });

    return () => {
      container.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [children, updateScrollState]);

  const scrollOneCard = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;

    const firstChild = container.firstElementChild as HTMLElement | null;
    if (!firstChild) return;

    const cardWidth = firstChild.offsetWidth;
    const gapStyle = window.getComputedStyle(container).columnGap || window.getComputedStyle(container).gap;
    const gap = gapStyle ? Number.parseFloat(gapStyle) : 16;
    const distance = (cardWidth + gap) * (direction === "left" ? -1 : 1);

    container.scrollBy({ left: distance, behavior: "smooth" });
  };

  return (
    <section className={className}>
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-black tracking-[-0.03em] text-cream-primary sm:text-2xl">{title}</h2>
          {subtitle ? <p className="text-sm font-bold text-sabio-light sm:text-base">{subtitle}</p> : null}
        </div>
        {linkTo ? (
          <Link
            to={linkTo}
            className="shrink-0 text-sm font-bold text-sabio-light transition hover:text-sabio"
          >
            {linkLabel} →
          </Link>
        ) : null}
      </div>

      <div className="relative overflow-hidden">
        <div
          ref={scrollRef}
          className="scrollbar-none flex max-w-full gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory"
        >
          {children}
        </div>

        {canScrollLeft ? (
          <button
            type="button"
            onClick={() => scrollOneCard("left")}
            aria-label="Anterior"
            className="absolute left-0 top-0 flex h-full w-10 shrink-0 items-center justify-center bg-gradient-to-r from-anime-main via-anime-main/80 to-transparent text-cream-primary transition hover:text-sabio-light"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-anime-border bg-anime-surface/90 backdrop-blur transition hover:border-sabio-dim hover:bg-anime-surface">
              <ChevronLeft size={18} />
            </span>
          </button>
        ) : null}

        {canScrollRight ? (
          <button
            type="button"
            onClick={() => scrollOneCard("right")}
            aria-label="Siguiente"
            className="absolute right-0 top-0 flex h-full w-10 shrink-0 items-center justify-center bg-gradient-to-l from-anime-main via-anime-main/80 to-transparent text-cream-primary transition hover:text-sabio-light"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-anime-border bg-anime-surface/90 backdrop-blur transition hover:border-sabio-dim hover:bg-anime-surface">
              <ChevronRight size={18} />
            </span>
          </button>
        ) : null}
      </div>
    </section>
  );
};
