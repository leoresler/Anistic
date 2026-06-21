import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "../../components/ui/PageHeader";
import { useAddons } from "../../hooks/useAddons";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { addonApi } from "../../lib/api";
import { AddonCard } from "./components/AddonCard";

export const AddonSettingsPage = () => {
  useDocumentTitle("Addons — Anistic");
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [reportReason, setReportReason] = useState<Record<string, string>>({});
  const { addons, isLoading, error: addonsError, addAddon, removeAddon } = useAddons();
  const recommendedQuery = useQuery({ queryKey: ["recommended-addons"], queryFn: addonApi.recommended });

  const reportMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => addonApi.report(id, reason),
    onSuccess: () => setMessage("Reporte enviado. Gracias por ayudar a mantener seguros los addons."),
    onError: (error) => setMessage(error.message),
  });

  return (
    <main className="min-h-screen px-5 py-8 text-cream-primary">
      <section className="relative z-10 mx-auto max-w-4xl rounded-4xl border border-anime-border bg-anime-surface/85 p-6 shadow-2xl shadow-black/35 backdrop-blur sm:p-8">
        <Link
          to="/inicio"
          className="inline-flex items-center gap-2 rounded-full border border-anime-border bg-anime-input px-4 py-2 text-sm font-black text-cream-primary transition hover:border-sabio-dim"
        >
          <ArrowLeft size={16} /> Volver al inicio
        </Link>

        <div className="mt-8">
          <PageHeader title="Addons de streaming" subtitle="Configuración" />
          <p className="mt-3 max-w-2xl font-semibold text-cream-secondary">
            Agregá manifest de Stremio o addons compatibles. Bloqueamos localhost, IPs privadas y addons sin permiso de
            stream para reducir riesgos.
          </p>
        </div>

        <section className="mt-6 rounded-3xl border border-anime-border bg-anime-input p-4">
          <h2 className="font-black text-sabio-light">Addons de confianza</h2>
          <p className="mt-2 font-semibold text-cream-secondary">
            {recommendedQuery.data?.message ?? "No hardcodeamos URLs riesgosas: usá fuentes que conozcas y revisá sus permisos."}
          </p>
        </section>

        <form
          className="mt-8 flex flex-col gap-3 rounded-3xl border border-anime-border bg-anime-input p-4 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            setMessage(null);
            setIsAdding(true);
            addAddon(url)
              .then(() => {
                setUrl("");
                setMessage("Addon agregado correctamente.");
              })
              .catch((error) => setMessage(error instanceof Error ? error.message : "No se pudo agregar el addon"))
              .finally(() => setIsAdding(false));
          }}
        >
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://addon.ejemplo.com"
            className="min-h-12 flex-1 rounded-2xl border border-anime-border bg-anime-main px-4 font-bold text-cream-primary outline-none transition placeholder:text-cream-secondary/60 focus:border-sabio-dim"
            required
          />
          <button
            type="submit"
            disabled={isAdding}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sabio px-5 py-3 font-black text-anime-main transition hover:bg-sabio-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={18} /> Agregar
          </button>
        </form>

        <p className="mt-3 text-sm font-bold text-cream-secondary">
          Addons son de terceros. Revisá sus políticas de privacidad.
        </p>

        {message ? (
          <p className="mt-4 rounded-2xl border border-anime-border bg-anime-input px-4 py-3 font-bold text-cream-primary">
            {message}
          </p>
        ) : null}
        {addonsError && !message ? (
          <p className="mt-4 rounded-2xl border border-anime-border bg-anime-input px-4 py-3 font-bold text-cream-primary">
            {addonsError.message}
          </p>
        ) : null}

        <div className="mt-8 space-y-3">
          {isLoading ? <p className="font-bold text-cream-secondary">Cargando addons...</p> : null}
          {addons.map((addon) => (
            <AddonCard
              key={addon.id}
              addon={addon}
              reportReason={reportReason[addon.id] ?? ""}
              onReportReasonChange={(reason) =>
                setReportReason((current) => ({ ...current, [addon.id]: reason }))
              }
              onRemove={() =>
                removeAddon(addon.id).catch((error) =>
                  setMessage(error instanceof Error ? error.message : "No se pudo eliminar el addon"),
                )
              }
              onReport={() =>
                reportMutation.mutate({ id: addon.id, reason: reportReason[addon.id] || "No funciona" })
              }
            />
          ))}
          {!isLoading && addons.length === 0 ? (
            <p className="rounded-3xl border border-anime-border bg-anime-input p-6 text-center font-bold text-cream-secondary">
              Todavía no agregaste addons.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
};
