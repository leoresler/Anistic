import { Link } from "react-router-dom";
import { Bell, Puzzle, Shield, UserRound } from "lucide-react";

import { PageHeader } from "../../components/ui/PageHeader";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

const settingsItems = [
  {
    to: "/perfil",
    icon: <UserRound size={20} />,
    title: "Mi perfil",
    description: "Datos de tu cuenta",
  },
  {
    to: "/addons",
    icon: <Puzzle size={20} />,
    title: "Addons",
    description: "Gestiona fuentes de streaming",
  },
  {
    to: "#",
    icon: <Bell size={20} />,
    title: "Notificaciones",
    description: "Próximamente",
  },
  {
    to: "#",
    icon: <Shield size={20} />,
    title: "Privacidad y seguridad",
    description: "Próximamente",
  },
];

export const ConfiguracionPage = () => {
  useDocumentTitle("Configuración — Anistic");

  return (
    <main className="min-h-screen px-5 py-8 text-cream-primary">
      <section className="relative z-10 mx-auto max-w-4xl rounded-4xl border border-anime-border bg-anime-surface/85 p-5 shadow-2xl shadow-black/35 backdrop-blur sm:p-8">
        <PageHeader title="Configuración" subtitle="Preferencias" />

        <div className="mt-8 grid gap-3">
          {settingsItems.map((item) => (
            <Link
              key={item.title}
              to={item.to}
              className="flex items-center gap-4 rounded-3xl border border-anime-border bg-anime-input p-4 transition hover:border-sabio-dim"
            >
              <span className="text-sabio-light">{item.icon}</span>
              <div>
                <h3 className="font-black text-cream-primary">{item.title}</h3>
                <p className="text-sm font-semibold text-cream-secondary">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
};
