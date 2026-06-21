import type { AuthResponse, AuthUser } from "@template/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  login: (response: AuthResponse) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: ({ user, token }) => set({ user, token }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: "template-auth",
      version: 1,
      partialize: ({ user, token }) => ({ user, token }),
    },
  ),
);
