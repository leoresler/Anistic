import { RotateCcw, ArrowRight, Shuffle } from "lucide-react";

import type { AiRecommendationHistoryItem } from "@template/shared";

type AiPromptPanelProps = {
  prompt: string;
  disabled: boolean;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  onSurprise: () => void;
  suggestions: string[];
  history: AiRecommendationHistoryItem[];
  onHistoryClick: (query: string) => void;
};

const Chip = ({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className="bg-anime-input/50 px-2.5 py-1 rounded-lg text-xs font-semibold text-cream-secondary transition hover:bg-anime-input hover:text-cream-primary disabled:opacity-50"
  >
    {label.length > 35 ? `${label.slice(0, 35)}…` : label}
  </button>
);

export const AiPromptPanel = ({
  prompt,
  disabled,
  onPromptChange,
  onSubmit,
  onClear,
  onSurprise,
  suggestions,
  history,
  onHistoryClick,
}: AiPromptPanelProps) => (
  <div className="space-y-4">
    <div className="overflow-hidden rounded-2xl border border-anime-border bg-anime-input">
      <textarea
        value={prompt}
        disabled={disabled}
        maxLength={300}
        onChange={(event) => onPromptChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !disabled) {
            event.preventDefault();
            onSubmit();
          }
        }}
        className="min-h-28 w-full resize-none bg-transparent px-4 py-3 text-sm font-semibold leading-6 text-cream-primary outline-none placeholder:text-cream-secondary/60 disabled:opacity-60"
        placeholder="Ej: quiero algo como Cowboy Bebop, melancólico pero con ritmo..."
      />
      <div className="flex items-center justify-between border-t border-anime-border bg-anime-main/60 px-3 py-1.5 backdrop-blur-sm">
        <span className="text-[10px] font-bold text-cream-secondary">{prompt.length}/300</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={disabled}
            onClick={onSurprise}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-cream-secondary transition hover:bg-anime-input hover:text-sabio-light disabled:opacity-50"
            aria-label="Sorprendeme"
            title="Sorprendeme"
          >
            <Shuffle size={14} />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onClear}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-cream-secondary transition hover:bg-anime-input hover:text-cream-primary disabled:opacity-50"
            aria-label="Reiniciar"
            title="Reiniciar"
          >
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onSubmit}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sabio text-anime-main transition hover:bg-sabio-light disabled:opacity-50"
            aria-label="Buscar"
            title="Buscar"
          >
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>

    <div>
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-sabio-light">Sugerencias</p>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((suggestion) => (
          <Chip key={suggestion} label={suggestion} disabled={disabled} onClick={() => onPromptChange(suggestion)} />
        ))}
      </div>
    </div>

    <div>
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-sabio-light">Recientes</p>
      <div className="flex flex-wrap gap-1.5">
        {history.slice(0, 5).map((item) => (
          <Chip key={item.id} label={item.query} disabled={disabled} onClick={() => onHistoryClick(item.query)} />
        ))}
        {history.length === 0 ? <span className="text-xs text-cream-secondary/50">Todavía no hay búsquedas</span> : null}
      </div>
    </div>
  </div>
);