import { useAuthStore } from "../../../store/auth.store";

const getGreeting = (hour: number): string => {
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
};

export const InicioGreeting = () => {
  const user = useAuthStore((state) => state.user);
  const hour = new Date().getHours();
  const greeting = getGreeting(hour);
  const name = user?.name ?? user?.email ?? user?.phone ?? "amigo";

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-black tracking-[-0.03em] text-cream-primary sm:text-3xl">
        {greeting}, {name}
      </h1>
      <p className="text-sm font-semibold text-cream-secondary">Acá está todo lo que tenemos para vos hoy.</p>
    </div>
  );
};
