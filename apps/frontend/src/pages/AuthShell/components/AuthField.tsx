import type { FieldProps } from "../types";

export const AuthField = ({ icon, hasError = false, ...props }: FieldProps) => (
  <label
    className={`flex items-center gap-3 rounded-2xl border bg-anime-input px-4 py-3 text-cream-primary transition hover:border-sabio-dim/70 focus-within:border-sabio-dim/70 ${
      hasError
        ? "border-red-400/80 shadow-sm shadow-red-500/15"
        : "border-anime-border"
    }`}
  >
    <span className={hasError ? "text-red-200" : "text-sabio"}>{icon}</span>
    <input
      aria-invalid={hasError}
      className="w-full bg-transparent outline-none placeholder:text-cream-secondary"
      {...props}
    />
  </label>
);
