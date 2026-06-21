import http from "node:http";
import type { AddressInfo } from "node:net";
import WebTorrent from "webtorrent";

const INFO_HASH_LENGTH = 40;
const PLAYABLE_EXTENSIONS = new Set([".mp4", ".mkv", ".webm", ".avi", ".mov"]);

export type TorrentFileLike = { name: string };

export const parseInfoHashFromPath = (url: string): string | null => {
  const parts = url.split("/").filter(Boolean);
  const infoHash = parts[0];
  if (!infoHash || infoHash.length !== INFO_HASH_LENGTH || parts.length !== 2 || parts[1] !== "stream") {
    return null;
  }
  return infoHash;
};

export const isPlayableFile = (file: TorrentFileLike): boolean => {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  return PLAYABLE_EXTENSIONS.has(ext);
};

export const selectPlayableFile = (files: TorrentFileLike[]): TorrentFileLike | null => {
  return files.find(isPlayableFile) ?? null;
};

export const buildStreamUrl = (port: number, infoHash: string): string => `http://localhost:${port}/${infoHash}/stream`;

export const createErrorResponse = (error: string): { error: string } => ({ error });

type WebTorrentClient = InstanceType<typeof WebTorrent>;

export interface TorrentServer {
  port: number;
  startStream: (infoHash: string) => Promise<string>;
  destroyTorrent: (infoHash: string) => void;
  close: () => Promise<void>;
}

export const createTorrentServer = async (
  client: WebTorrentClient,
  onProgress?: (infoHash: string, progress: number) => void,
): Promise<TorrentServer> => {
  const torrents = new Map<string, unknown>();

  const handleRequest = (req: http.IncomingMessage, res: http.ServerResponse): void => {
    const infoHash = parseInfoHashFromPath(req.url ?? "");

    if (!infoHash) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(createErrorResponse("invalid path")));
      return;
    }

    const torrent = torrents.get(infoHash) as { files: Array<{ name: string; length: number; createReadStream: (opts?: { start?: number; end?: number }) => NodeJS.ReadableStream }> } | undefined;

    if (!torrent) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(createErrorResponse("torrent not found")));
      return;
    }

    const file = selectPlayableFile(torrent.files);

    if (!file) {
      res.statusCode = 415;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(createErrorResponse("no playable media")));
      return;
    }

    const playableFile = file as typeof torrent.files[number];
    const totalSize = playableFile.length;
    const range = req.headers.range;
    let start = 0;
    let end = Math.max(0, totalSize - 1);

    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (match) {
        const startValue = match[1] ? Number.parseInt(match[1], 10) : undefined;
        const endValue = match[2] ? Number.parseInt(match[2], 10) : undefined;
        if (startValue !== undefined && !Number.isNaN(startValue)) start = startValue;
        if (endValue !== undefined && !Number.isNaN(endValue)) end = endValue;
      }
      res.statusCode = 206;
      res.setHeader("Content-Range", `bytes ${start}-${end}/${totalSize}`);
    } else {
      res.statusCode = 200;
    }

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Length", String(end - start + 1));

    const stream = playableFile.createReadStream({ start, end });
    stream.on("error", () => {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(createErrorResponse("streaming failed")));
      }
    });
    stream.pipe(res);
  };

  const server = http.createServer(handleRequest);

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as AddressInfo;
  const port = address.port;

  const startStream = async (infoHash: string): Promise<string> => {
    if (torrents.has(infoHash)) {
      return buildStreamUrl(port, infoHash);
    }

    return new Promise((resolve, reject) => {
      let settled = false;

      const torrent = client.add(infoHash, { destroyStoreOnDestroy: false }, () => {
        if (settled) return;
        settled = true;
        torrents.set(infoHash, torrent);
        torrent.on("download", () => {
          onProgress?.(infoHash, Math.round(torrent.progress * 100) / 100);
        });
        resolve(buildStreamUrl(port, infoHash));
      });

      torrent.on("error", (err: unknown) => {
        if (settled) return;
        settled = true;
        reject(err instanceof Error ? err : new Error("torrent failed"));
      });

      setTimeout(() => {
        if (!settled) {
          settled = true;
          torrent.destroy();
          reject(new Error("torrent metadata timeout"));
        }
      }, 30_000);
    });
  };

  const destroyTorrent = (infoHash: string): void => {
    const torrent = torrents.get(infoHash) as { destroy: () => void } | undefined;
    if (torrent) {
      torrent.destroy();
      torrents.delete(infoHash);
    }
  };

  const close = (): Promise<void> =>
    new Promise((resolve) => {
      for (const torrent of torrents.values()) {
        (torrent as { destroy: () => void }).destroy();
      }
      torrents.clear();
      server.close(() => resolve());
    });

  return { port, startStream, destroyTorrent, close };
};
