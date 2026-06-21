import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { googleAuthSchema, type AuthResponse } from "@template/shared";

import { authApi } from "../../lib/api";
import { useAuthStore } from "../../store/auth.store";
import { appToast } from "../../utils/toast";
import { AuthBrand } from "./components/AuthBrand";
import { GoogleSignInButton } from "./components/GoogleSignInButton";
import { UnifiedAuthForm } from "./components/UnifiedAuthForm";
import type { AuthMode, ResolvedCredential } from "./types";

type AuthShellProps = {
  mode: AuthMode;
};

export const AuthShell = ({ mode }: AuthShellProps) => {
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const onSuccess = (response: AuthResponse) => {
    appToast.success("¡Bienvenido!");
    login(response);
  };

  const mutation = useMutation({
    mutationFn: ({ type, payload }: ResolvedCredential) => {
      if (type === "email") {
        return mode === "login"
          ? authApi.loginEmail(payload)
          : authApi.registerEmail(payload);
      }

      return mode === "login"
        ? authApi.loginPhone(payload)
        : authApi.registerPhone(payload);
    },
    onSuccess,
  });

  const googleMutation = useMutation({
    mutationFn: async (idToken: string) => {
      const payload = googleAuthSchema.parse({ idToken });
      return authApi.loginGoogle(payload);
    },
    onSuccess,
    onError: (error) => appToast.error(error.message),
  });

  const switchMode = (next: AuthMode) => {
    navigate(next === "login" ? "/login" : "/register", { replace: true });
  };

  return (
    <main className="grain relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-anime-main px-5 py-8 text-cream-primary">
      <div className="absolute -left-48 -top-48 h-96 w-96 rounded-full bg-sabio/12 blur-3xl" />
      <div className="absolute -bottom-56 -right-40 h-128 w-md rounded-full bg-sabio-dim/18 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-sabio/40 to-transparent" />
      <AuthBrand />
      <div className="absolute inset-x-0 top-28 z-20 flex justify-center px-5 md:top-32">
        <h1 className="text-center text-2xl font-black tracking-[0.12em] text-cream-primary drop-shadow-lg md:text-3xl">
          {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </h1>
      </div>
      <section className="relative z-10 grid w-full max-w-2xl overflow-hidden rounded-4xl border border-anime-border bg-anime-surface/90 shadow-2xl shadow-black/35 backdrop-blur">
        <div className="p-6 md:p-10">
          <UnifiedAuthForm
            mode={mode}
            setMode={switchMode}
            loading={mutation.isPending}
            onSubmit={mutation.mutateAsync}
          />

          <div className="my-7 flex items-center gap-3 text-xs uppercase tracking-[0.32em] text-cream-secondary">
            <span className="h-px flex-1 bg-anime-border" /> o continuar con{" "}
            <span className="h-px flex-1 bg-anime-border" />
          </div>

          <GoogleSignInButton
            loading={googleMutation.isPending}
            onCredential={googleMutation.mutate}
          />
        </div>
      </section>
    </main>
  );
};
