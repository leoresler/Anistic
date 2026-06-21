import { Trash2 } from "lucide-react";

import type { UserAddon } from "../../../lib/api";

const formatDate = (value: string) => new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(value));

type AddonCardProps = {
  addon: UserAddon;
  reportReason: string;
  onReportReasonChange: (reason: string) => void;
  onRemove: () => void;
  onReport: () => void;
};

export const AddonCard = ({
  addon,
  reportReason,
  onReportReasonChange,
  onRemove,
  onReport,
}: AddonCardProps) => {
  const resources = (addon.manifest?.resources ?? []).map((resource) =>
    typeof resource === "string" ? resource : JSON.stringify(resource),
  );
  const types = addon.manifest?.types ?? [];

  return (
    <article className="rounded-3xl border border-anime-border bg-anime-input p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-cream-primary">{addon.name}</h2>
          <p className="mt-1 break-all text-sm font-bold text-cream-secondary">{addon.url}</p>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-sabio-light">
            Agregado {formatDate(addon.createdAt)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.16em]">
            {resources.map((resource) => (
              <span key={resource} className="rounded-full border border-anime-border bg-anime-main px-3 py-1 text-cream-secondary">
                Recurso: {resource}
              </span>
            ))}
            {types.map((type) => (
              <span key={type} className="rounded-full border border-anime-border bg-anime-main px-3 py-1 text-cream-secondary">
                Tipo: {type}
              </span>
            ))}
            {!resources.length && !types.length ? (
              <span className="text-cream-secondary">Sin permisos detallados en el manifest.</span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-anime-border bg-anime-main px-4 py-3 font-black text-cream-primary transition hover:border-red-400/50 hover:bg-red-500/10"
        >
          <Trash2 size={18} /> Eliminar
        </button>
      </div>
      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          onReport();
        }}
      >
        <input
          value={reportReason}
          onChange={(event) => onReportReasonChange(event.target.value)}
          placeholder="Motivo del problema"
          className="min-h-11 flex-1 rounded-2xl border border-anime-border bg-anime-main px-4 font-bold text-cream-primary outline-none transition placeholder:text-cream-secondary/60 focus:border-sabio-dim"
        />
        <button
          type="submit"
          className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-2 font-black text-red-100 transition hover:bg-red-500/20"
        >
          Reportar problema
        </button>
      </form>
    </article>
  );
};
