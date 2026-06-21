import { useEffect, useRef, useState } from "react";

import { appToast } from "../../../utils/toast";

type GoogleCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              type?: "standard" | "icon";
              width?: string;
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
            },
          ) => void;
        };
      };
    };
  }
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
let googleScriptPromise: Promise<void> | null = null;

const loadGoogleScript = () => {
  if (window.google) {
    return Promise.resolve();
  }

  googleScriptPromise ??= new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.append(script);
  });

  return googleScriptPromise;
};

type GoogleSignInButtonProps = {
  loading: boolean;
  onCredential: (idToken: string) => void;
};

export const GoogleSignInButton = ({ loading, onCredential }: GoogleSignInButtonProps) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(
    googleClientId ? null : "Configurá VITE_GOOGLE_CLIENT_ID para usar Google Sign-In.",
  );

  useEffect(() => {
    if (!googleClientId || !buttonRef.current) {
      return;
    }

    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google) {
          return;
        }

        buttonRef.current.replaceChildren();
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            if (!response.credential) {
              appToast.error("Google no devolvió una credencial valida");
              return;
            }

            onCredential(response.credential);
          },
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          width: "360",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "center",
        });
      })
      .catch(() => {
        if (!cancelled) {
          setError("No pudimos cargar Google Sign-In. Probá de nuevo en unos segundos.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [onCredential]);

  if (error) {
    return (
      <p className="rounded-2xl border border-anime-border bg-anime-input px-5 py-4 text-center text-sm font-bold text-cream-secondary">
        {error}
      </p>
    );
  }

  return (
    <div
      aria-busy={loading}
      className="flex min-h-12 w-full items-center justify-center px-2 py-1.5"
    >
      <div
        ref={buttonRef}
        className={loading ? "pointer-events-none opacity-60" : undefined}
      />
    </div>
  );
};
