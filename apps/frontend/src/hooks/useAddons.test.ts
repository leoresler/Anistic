import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { UserAddon, UserAddonManifest } from "@template/shared";

import { AddonSettingsPage } from "../pages/AddonSettingsPage/AddonSettingsPage";
import { addonApi } from "../lib/api";
import { fetchAddonManifest, useAddons, type AddonsState } from "./useAddons";

const validManifest: UserAddonManifest = {
  id: "test-addon",
  name: "Test Addon",
  version: "1.0",
  resources: ["stream"],
};

const apiAddon: UserAddon = {
  id: "api-1",
  userId: "u1",
  name: "API Addon",
  url: "https://api.addon/manifest.json",
  manifest: validManifest,
  createdAt: "2026-01-01T00:00:00Z",
};

const setGlobalWindow = (value: Window & { electron?: unknown }) => {
  (globalThis as unknown as Record<string, unknown>).window = value;
};

const restoreGlobalWindow = () => {
  delete (globalThis as unknown as Record<string, unknown>).window;
};

const withMockedFetch = (
  handler: (url: string) => Promise<Response> | Response,
) => {
  (globalThis as unknown as Record<string, (url: string) => Promise<Response> | Response>).fetch =
    handler;
};

describe("fetchAddonManifest", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    (globalThis as unknown as Record<string, unknown>).fetch = originalFetch;
  });

  it("returns a valid manifest", async () => {
    withMockedFetch(() => new Response(JSON.stringify(validManifest), { status: 200 }));
    const result = await fetchAddonManifest("https://example.com/manifest.json");
    assert.equal(result.id, validManifest.id);
    assert.equal(result.name, validManifest.name);
  });

  it("throws 'Respuesta inválida' when JSON does not match manifest shape", async () => {
    withMockedFetch(() => new Response(JSON.stringify({ id: 123 }), { status: 200 }));
    await assert.rejects(
      async () => fetchAddonManifest("https://example.com/manifest.json"),
      /Respuesta inválida/,
    );
  });

  it("throws 'No se pudo conectar' for non-ok HTTP responses", async () => {
    withMockedFetch(() => new Response("Internal Server Error", { status: 500 }));
    await assert.rejects(
      async () => fetchAddonManifest("https://example.com/manifest.json"),
      /No se pudo conectar/,
    );
  });

  it("throws 'No se pudo conectar' when fetch is aborted", async () => {
    withMockedFetch(() => {
      throw new DOMException("The operation was aborted", "AbortError");
    });
    await assert.rejects(
      async () => fetchAddonManifest("https://example.com/manifest.json"),
      /No se pudo conectar/,
    );
  });
});

describe("useAddons", () => {
  let captured: AddonsState | null = null;
  const originalCreate = addonApi.create;
  const originalList = addonApi.list;
  const originalRemove = addonApi.remove;
  const originalFetch = globalThis.fetch;

  const TestComponent = () => {
    captured = useAddons();
    return null;
  };

  const renderHook = (win: Window & { electron?: unknown }): AddonsState => {
    captured = null;
    setGlobalWindow(win);
    renderToString(React.createElement(TestComponent));
    assert.ok(captured, "hook result was captured during render");
    return captured!;
  };

  beforeEach(() => {
    captured = null;
    addonApi.create = originalCreate;
    addonApi.list = originalList;
    addonApi.remove = originalRemove;
    (globalThis as unknown as Record<string, unknown>).fetch = originalFetch;
  });

  afterEach(() => {
    restoreGlobalWindow();
  });

  it("detects browser mode when window.electron is absent", () => {
    const result = renderHook({} as Window);
    assert.equal(result.isLoading, true);
  });

  it("persists a new addon via electron bridge in desktop mode", async () => {
    const stored: UserAddon[] = [];
    const bridge = {
      getStore: <T>(_key: string): T | null => stored as T,
      setStore: <T>(_key: string, value: T): void => {
        stored.length = 0;
        stored.push(...(value as UserAddon[]));
      },
      streamTorrent: async () => ({ port: 0, url: "" }),
      destroyTorrent: () => {},
      getPort: () => 0,
      onProgress: () => () => {},
    };

    const result = renderHook({ electron: bridge } as unknown as Window & { electron?: unknown });
    withMockedFetch(() => new Response(JSON.stringify(validManifest), { status: 200 }));

    await result.addAddon("https://desktop.addon/manifest.json");

    assert.equal(stored.length, 1);
    assert.equal(stored[0].name, validManifest.name);
    assert.equal(stored[0].url, "https://desktop.addon/manifest.json");
  });

  it("removes an addon via electron bridge in desktop mode", async () => {
    const initial: UserAddon[] = [
      { ...apiAddon, id: "desktop-1", userId: "desktop", url: "https://keep.addon" },
      { ...apiAddon, id: "desktop-2", userId: "desktop", url: "https://remove.addon" },
    ];
    const stored: UserAddon[] = [...initial];
    const bridge = {
      getStore: <T>(_key: string): T | null => stored as T,
      setStore: <T>(_key: string, value: T): void => {
        stored.length = 0;
        stored.push(...(value as UserAddon[]));
      },
      streamTorrent: async () => ({ port: 0, url: "" }),
      destroyTorrent: () => {},
      getPort: () => 0,
      onProgress: () => () => {},
    };

    const result = renderHook({ electron: bridge } as unknown as Window & { electron?: unknown });
    await result.removeAddon("desktop-2");

    assert.equal(stored.length, 1);
    assert.equal(stored[0].id, "desktop-1");
  });

  it("creates browser addons via addonApi.create", async () => {
    const created: UserAddon[] = [];
    addonApi.create = async (url: string) => {
      const addon: UserAddon = { ...apiAddon, id: `created-${created.length}`, url };
      created.push(addon);
      return addon;
    };

    const result = renderHook({} as Window);
    withMockedFetch(() => new Response(JSON.stringify(validManifest), { status: 200 }));

    await result.addAddon("https://browser.addon/manifest.json");

    assert.equal(created.length, 1);
    assert.equal(created[0].url, "https://browser.addon/manifest.json");
  });
});

describe("AddonSettingsPage disclaimer", () => {
  const originalList = addonApi.list;
  const originalRecommended = addonApi.recommended;

  afterEach(() => {
    addonApi.list = originalList;
    addonApi.recommended = originalRecommended;
    restoreGlobalWindow();
  });

  it("renders the third-party addon disclaimer", () => {
    setGlobalWindow({} as Window);
    addonApi.list = async () => [];
    addonApi.recommended = async () => ({ recommended: [], message: "" });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });

    const html = renderToString(
      React.createElement(
        MemoryRouter,
        {},
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          React.createElement(AddonSettingsPage),
        ),
      ),
    );

    assert.ok(
      html.includes("Addons son de terceros. Revisá sus políticas de privacidad."),
      "disclaimer is visible on the add-on settings page",
    );
  });
});
