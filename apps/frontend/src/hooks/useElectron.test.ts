import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { detectElectronBridge, type ElectronDetection } from "./useElectron";

const mockBridge = {
  getStore: <T>(_key: string): T | null => null,
  setStore: <T>(_key: string, _value: T): void => {},
  streamTorrent: async (_infoHash: string) => ({ port: 13333, url: "http://localhost:13333/test/stream" }),
  destroyTorrent: (_infoHash: string): void => {},
  getPort: () => 13333,
  onProgress: (_callback: (_infoHash: string, _progress: number) => void) => () => {},
};

const detect = (windowObj: Window & { electron?: typeof mockBridge }): ElectronDetection => detectElectronBridge(windowObj);

describe("detectElectronBridge", () => {
  it("detects desktop when window.electron is an object", () => {
    const result = detect({ electron: mockBridge } as unknown as Window & { electron?: typeof mockBridge });
    assert.equal(result.isDesktop, true);
    assert.equal(result.bridge, mockBridge);
  });

  it("returns browser mode when window.electron is undefined", () => {
    const result = detect({} as Window & { electron?: typeof mockBridge });
    assert.equal(result.isDesktop, false);
    assert.equal(result.bridge, null);
  });

  it("returns browser mode when window.electron is null", () => {
    const result = detect({ electron: null } as unknown as Window & { electron?: typeof mockBridge });
    assert.equal(result.isDesktop, false);
    assert.equal(result.bridge, null);
  });
});
