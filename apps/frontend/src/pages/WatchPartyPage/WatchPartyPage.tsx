import { Users } from "lucide-react";

import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

export const WatchPartyPage = () => {
  useDocumentTitle("Watch Party — Anistic");

  return (
    <main className="min-h-screen px-5 py-8 text-cream-primary">
      <section className="relative z-10 mx-auto max-w-4xl rounded-4xl border border-anime-border bg-anime-surface/85 p-5 shadow-2xl shadow-black/35 backdrop-blur sm:p-8">
        <PageHeader title="Watch Party" subtitle="Próximamente" />
        <div className="mt-8">
          <EmptyState
            icon={<Users size={32} />}
            title="Watch Party llega pronto"
            description="Vas a poder ver anime sincronizado con amigos. Por ahora, prepará pochoclos."
          />
        </div>
      </section>
    </main>
  );
};
