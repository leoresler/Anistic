import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  compact?: boolean;
};

export const SearchInput = ({ value, onChange, placeholder = "Buscar anime", compact }: SearchInputProps) => {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (draft !== value) onChange(draft);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [draft, onChange, value]);

  return (
    <div className="relative w-full">
      <Search className={`absolute left-4 top-1/2 -translate-y-1/2 text-cream-secondary ${compact ? "size-4" : "size-[22px]"}`} />
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-full border border-anime-border bg-anime-input pl-11 pr-11 font-bold text-cream-primary shadow-[0_20px_80px_rgba(0,0,0,0.35)] outline-none transition placeholder:text-cream-secondary/60 focus:border-sabio-dim focus:ring-4 focus:ring-sabio/15 ${
          compact ? "h-10 text-sm" : "h-16 text-lg"
        }`}
      />
      {draft ? (
        <button
          type="button"
          onClick={() => {
            setDraft("");
            onChange("");
          }}
          className={`absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full bg-cream-primary text-anime-main transition hover:bg-sabio-light ${
            compact ? "h-7 w-7" : "h-9 w-9"
          }`}
          aria-label="Limpiar búsqueda"
        >
          <X size={compact ? 14 : 16} />
        </button>
      ) : null}
    </div>
  );
};