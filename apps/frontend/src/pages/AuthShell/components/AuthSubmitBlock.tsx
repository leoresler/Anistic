import type { AuthMode } from "../types";

type SubmitBlockProps = {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  loading: boolean;
};

export const AuthSubmitBlock = ({ mode, setMode, loading }: SubmitBlockProps) => (
  <div className="space-y-4 pt-2">
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-full bg-sabio px-5 py-4 font-black text-anime-main shadow-xl transition hover:-translate-y-0.5 hover:bg-sabio-light disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading
        ? "Procesando..."
        : mode === "login"
          ? "Iniciar sesión"
          : "Crear cuenta"}
    </button>
    <button
      type="button"
      onClick={() => setMode(mode === "login" ? "register" : "login")}
      className="w-full text-sm font-bold text-cream-secondary underline-offset-4 hover:text-sabio-light hover:underline"
    >
      {mode === "login" ? "¿Ya tenés una cuenta?" : "Ya tengo cuenta"}
    </button>
  </div>
);
