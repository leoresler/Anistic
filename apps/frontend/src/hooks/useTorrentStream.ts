import { useCallback } from "react";

import { useElectron } from "./useElectron";

export interface TorrentStreamActions {
  start: (infoHash: string) => Promise<{ port: number; url: string }>;
  destroy: (infoHash: string) => void;
}

export const useTorrentStream = (): TorrentStreamActions => {
  const { bridge } = useElectron();

  const start = useCallback(
    async (infoHash: string) => {
      if (!bridge) {
        throw new Error("Torrent streaming solo disponible en desktop");
      }
      return bridge.streamTorrent(infoHash);
    },
    [bridge],
  );

  const destroy = useCallback(
    (infoHash: string) => {
      bridge?.destroyTorrent(infoHash);
    },
    [bridge],
  );

  return { start, destroy };
};
