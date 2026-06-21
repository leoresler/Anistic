import { useCallback, useEffect, useState } from "react";

import type { UserAddon, UserAddonManifest } from "@template/shared";

import { addonApi } from "../lib/api";
import { useElectron } from "./useElectron";

export type AddAddonInput = { url: string };

const ADDON_TIMEOUT_MS = 5_000;

const generateLocalId = (): string => `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const fetchAddonManifest = async (url: string): Promise<UserAddonManifest> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ADDON_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error("No se pudo conectar");
    }

    const body = (await response.json()) as UserAddonManifest;
    if (!body || typeof body.id !== "string" || typeof body.name !== "string") {
      throw new Error("Respuesta inválida");
    }
    return body;
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("No se pudo conectar");
    }
    throw error instanceof Error ? error : new Error("No se pudo conectar");
  }
};

export interface AddonsState {
  addons: UserAddon[];
  isLoading: boolean;
  error: Error | null;
  addAddon: (url: string) => Promise<void>;
  removeAddon: (id: string) => Promise<void>;
}

export const useAddons = (): AddonsState => {
  const { isDesktop, bridge } = useElectron();
  const [addons, setAddons] = useState<UserAddon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadDesktopAddons = useCallback(() => {
    try {
      const stored = bridge?.getStore<UserAddon[]>("addons");
      setAddons(Array.isArray(stored) ? stored : []);
    } catch {
      setAddons([]);
      setError(new Error("No se pudieron cargar los addons locales"));
    } finally {
      setIsLoading(false);
    }
  }, [bridge]);

  const loadBrowserAddons = useCallback(async () => {
    try {
      const list = await addonApi.list();
      setAddons(Array.isArray(list) ? list : []);
    } catch {
      setAddons([]);
      setError(new Error("No se pudieron cargar los addons"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isDesktop) {
      loadDesktopAddons();
      return;
    }
    void loadBrowserAddons();
  }, [isDesktop, loadDesktopAddons, loadBrowserAddons]);

  const addAddon = useCallback(
    async (url: string) => {
      const manifest = await fetchAddonManifest(url);

      if (isDesktop && bridge) {
        const stored = bridge.getStore<UserAddon[]>("addons") ?? [];
        const next: UserAddon = {
          id: generateLocalId(),
          userId: "desktop",
          name: manifest.name,
          url,
          manifest,
          createdAt: new Date().toISOString(),
        };
        const updated = [...stored, next];
        bridge.setStore("addons", updated);
        setAddons(updated);
        return;
      }

      const created = await addonApi.create(url);
      setAddons((current) => [...current, created]);
    },
    [bridge, isDesktop],
  );

  const removeAddon = useCallback(
    async (id: string) => {
      if (isDesktop && bridge) {
        const stored = bridge.getStore<UserAddon[]>("addons") ?? [];
        const updated = stored.filter((addon) => addon.id !== id);
        bridge.setStore("addons", updated);
        setAddons(updated);
        return;
      }

      await addonApi.remove(id);
      setAddons((current) => current.filter((addon) => addon.id !== id));
    },
    [bridge, isDesktop],
  );

  return { addons, isLoading, error, addAddon, removeAddon };
};
