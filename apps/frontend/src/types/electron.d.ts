export interface ElectronBridge {
  getStore: <T>(key: string) => T | null;
  setStore: <T>(key: string, value: T) => void;
  streamTorrent: (infoHash: string) => Promise<{ port: number; url: string }>;
  destroyTorrent: (infoHash: string) => void;
  getPort: () => number;
  onProgress: (callback: (infoHash: string, progress: number) => void) => () => void;
}

declare global {
  interface Window {
    electron?: ElectronBridge;
  }
}

export {};
