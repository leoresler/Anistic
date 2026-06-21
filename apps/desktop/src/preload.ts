import { contextBridge, ipcRenderer } from "electron";

export interface ElectronBridge {
  getStore: <T>(key: string) => T | null;
  setStore: <T>(key: string, value: T) => void;
  streamTorrent: (infoHash: string) => Promise<{ port: number; url: string }>;
  destroyTorrent: (infoHash: string) => void;
  getPort: () => number;
  onProgress: (callback: (infoHash: string, progress: number) => void) => () => void;
}

const electronBridge: ElectronBridge = {
  getStore: <T>(key: string): T | null => ipcRenderer.sendSync("store:get", { key }),
  setStore: <T>(key: string, value: T): void => ipcRenderer.send("store:set", { key, value }),
  streamTorrent: (infoHash: string) => ipcRenderer.invoke("torrent:stream", { infoHash }),
  destroyTorrent: (infoHash: string) => ipcRenderer.send("torrent:destroy", { infoHash }),
  getPort: () => ipcRenderer.sendSync("app:get-port"),
  onProgress: (callback) => {
    const handler = (_event: unknown, payload: { infoHash: string; progress: number }) => {
      callback(payload.infoHash, payload.progress);
    };
    ipcRenderer.on("torrent:progress", handler);
    return () => ipcRenderer.removeListener("torrent:progress", handler);
  },
};

contextBridge.exposeInMainWorld("electron", electronBridge);
