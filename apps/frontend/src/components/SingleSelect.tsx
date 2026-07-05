import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type SingleSelectProps = {
  label: string;
  options: { label: string; value: string }[];
  currentValue: string;
  onChange: (value: string) => void;
  /** Label del botón "reset" (vacío). Si se omite, no se renderiza. */
  allLabel?: string;
};

export const SingleSelect = ({ label, options, allLabel, currentValue, onChange }: SingleSelectProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const currentLabel = currentValue
    ? (options.find((o) => o.value === currentValue)?.label ?? allLabel ?? label)
    : (allLabel ?? label);
  const active = currentValue !== "";

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
        {label}: {currentLabel}
        <ChevronDown size={12} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-30 mt-2 w-48 overflow-auto rounded-2xl border border-anime-border bg-anime-surface/95 p-2 shadow-2xl shadow-black/40 backdrop-blur">
          {allLabel ? (
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold transition ${
                currentValue === "" ? "bg-sabio/20 text-sabio-light" : "text-cream-primary hover:bg-anime-input"
              }`}
            >
              {allLabel}
            </button>
          ) : null}
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold transition ${
                currentValue === opt.value ? "bg-sabio/20 text-sabio-light" : "text-cream-primary hover:bg-anime-input"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
