import { UserRound } from "lucide-react";

import { Avatar } from "../../components/ui/Avatar";
import { PageHeader } from "../../components/ui/PageHeader";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useAuthStore } from "../../store/auth.store";

export const PerfilPage = () => {
  useDocumentTitle("Mi perfil — Anistic");
  const user = useAuthStore((state) => state.user);

  const displayName = user?.name ?? user?.email ?? user?.phone ?? "Usuario";

  return (
    <main className="min-h-screen px-5 py-8 text-cream-primary">
      <section className="relative z-10 mx-auto max-w-4xl rounded-4xl border border-anime-border bg-anime-surface/85 p-5 shadow-2xl shadow-black/35 backdrop-blur sm:p-8">
        <PageHeader title="Mi perfil" subtitle="Usuario" />

        <div className="mt-8 flex items-center gap-4">
          <Avatar name={displayName} imageUrl={user?.avatarUrl} size="lg" />
          <div>
            <h2 className="text-2xl font-black text-cream-primary">{displayName}</h2>
            {user?.email ? <p className="font-semibold text-cream-secondary">{user.email}</p> : null}
            {user?.phone ? <p className="font-semibold text-cream-secondary">{user.phone}</p> : null}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <ProfileField label="Email" value={user?.email ?? "No configurado"} />
          <ProfileField label="Teléfono" value={user?.phone ?? "No configurado"} />
          <ProfileField label="Google" value={user?.googleId ? "Conectado" : "No conectado"} />
          <ProfileField label="ID de usuario" value={user?.id ?? "-"} />
        </div>
      </section>
    </main>
  );
};

const ProfileField = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-3xl border border-anime-border bg-anime-input p-5">
    <p className="text-xs uppercase tracking-[0.28em] text-cream-secondary">{label}</p>
    <p className="mt-3 break-words text-lg font-bold text-cream-primary">{value}</p>
  </div>
);
