import { useEffect } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthenticatedLayout } from "./components/layout/AuthenticatedLayout";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { AddonSettingsPage } from "./pages/AddonSettingsPage/AddonSettingsPage";
import { AiRecommendationsPage } from "./pages/AiRecommendationsPage/AiRecommendationsPage";
import { AnimeDetailPage } from "./pages/AnimeDetailPage/AnimeDetailPage";
import { AuthShell } from "./pages/AuthShell/AuthShell";
import { ConfiguracionPage } from "./pages/ConfiguracionPage/ConfiguracionPage";
import { ExplorePage } from "./pages/ExplorePage/ExplorePage";
import { InicioPage } from "./pages/InicioPage/InicioPage";
import { MiListaPage } from "./pages/MiListaPage/MiListaPage";
import { PerfilPage } from "./pages/PerfilPage/PerfilPage";
import { WatchPage } from "./pages/WatchPage/WatchPage";
import { WatchPartyPage } from "./pages/WatchPartyPage/WatchPartyPage";
import { authApi } from "./lib/api";
import { useAuthStore } from "./store/auth.store";

const queryClient = new QueryClient();

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppRoutes />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: "#1a1a19",
          color: "#f4f3ef",
          border: "1px solid #262625",
          borderRadius: "12px",
        },
        success: {
          iconTheme: {
            primary: "#87a987",
            secondary: "#f4f3ef",
          },
        },
        error: {
          iconTheme: {
            primary: "#e06c75",
            secondary: "#f4f3ef",
          },
        },
        loading: {
          iconTheme: {
            primary: "#87a987",
            secondary: "#f4f3ef",
          },
        },
      }}
    />
  </QueryClientProvider>
);

const SessionBootstrap = () => {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const sessionQuery = useQuery({
    queryKey: ["auth", "me", token],
    queryFn: () => authApi.currentUser(token ?? ""),
    enabled: Boolean(token),
    retry: false,
  });

  useEffect(() => {
    if (!token) {
      return;
    }

    if (sessionQuery.data) {
      setUser(sessionQuery.data.user);
      return;
    }

    if (sessionQuery.isError) {
      logout();
    }
  }, [logout, sessionQuery.data, sessionQuery.isError, setUser, token]);

  if (token && sessionQuery.isPending) {
    return <SessionBootstrapScreen />;
  }

  return <Outlet />;
};

const SessionBootstrapScreen = () => (
  <main className="grain flex min-h-screen items-center justify-center bg-anime-main px-5 text-cream-primary">
    <div className="rounded-3xl border border-anime-border bg-anime-surface/90 px-6 py-5 text-center shadow-2xl shadow-black/35">
      <p className="text-xs font-bold uppercase tracking-[0.32em] text-sabio-light">Validando sesión</p>
      <p className="mt-2 text-sm text-cream-secondary">Un segundo...</p>
    </div>
  </main>
);

const RequireAuth = () => {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

const GuestOnly = () => {
  const token = useAuthStore((state) => state.token);

  if (token) {
    return <Navigate to="/inicio" replace />;
  }

  return <Outlet />;
};

const RootRedirect = () => {
  const token = useAuthStore((state) => state.token);
  return <Navigate to={token ? "/inicio" : "/login"} replace />;
};

const NotFoundRedirect = () => {
  const token = useAuthStore((state) => state.token);
  return <Navigate to={token ? "/inicio" : "/login"} replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route element={<SessionBootstrap />}>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<AuthShell mode="login" />} />
        <Route path="/register" element={<AuthShell mode="register" />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AuthenticatedLayout />}>
          <Route path="/inicio" element={<ErrorBoundary><InicioPage /></ErrorBoundary>} />
          <Route path="/explorar" element={<ErrorBoundary><ExplorePage /></ErrorBoundary>} />
          <Route path="/mi-lista" element={<ErrorBoundary><MiListaPage /></ErrorBoundary>} />
          <Route path="/recomendaciones-ia" element={<ErrorBoundary><AiRecommendationsPage /></ErrorBoundary>} />
          <Route path="/watch-party" element={<ErrorBoundary><WatchPartyPage /></ErrorBoundary>} />
          <Route path="/perfil" element={<ErrorBoundary><PerfilPage /></ErrorBoundary>} />
          <Route path="/configuracion" element={<ErrorBoundary><ConfiguracionPage /></ErrorBoundary>} />
          <Route path="/addons" element={<ErrorBoundary><AddonSettingsPage /></ErrorBoundary>} />
          <Route path="/anime/:malId" element={<ErrorBoundary><AnimeDetailPage /></ErrorBoundary>} />
          <Route path="/watch/:malId" element={<ErrorBoundary><WatchPage /></ErrorBoundary>} />
        </Route>
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="/dashboard" element={<Navigate to="/inicio" replace />} />
      <Route path="/settings/addons" element={<Navigate to="/addons" replace />} />
      <Route path="/explore" element={<Navigate to="/explorar" replace />} />
      <Route path="*" element={<NotFoundRedirect />} />
    </Route>
  </Routes>
);
