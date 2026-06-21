import { Component, type ErrorInfo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "./PageHeader";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

const Fallback = ({ error, onReset }: { error: Error | null; onReset: () => void }) => {
  const navigate = useNavigate();

  return (
    <main className="relative z-10 mx-auto max-w-4xl px-5 py-16">
      <PageHeader title="Algo salió mal" subtitle="Error" />
      <div className="mt-8 rounded-4xl border border-anime-border bg-anime-surface/85 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
        <p className="font-bold text-cream-secondary">
          {error?.message ?? "Ocurrió un error inesperado. Intentá de nuevo."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onReset}
            className="rounded-full bg-sabio px-6 py-3 font-black text-anime-main transition hover:bg-sabio-light"
          >
            Reintentar
          </button>
          <button
            type="button"
            onClick={() => navigate("/inicio")}
            className="rounded-full border border-anime-border bg-anime-input px-6 py-3 font-black text-cream-primary transition hover:border-sabio-dim"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    </main>
  );
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <Fallback error={this.state.error} onReset={this.reset} />;
    }

    return this.props.children;
  }
}
