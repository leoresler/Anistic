declare module "webtorrent" {
  export interface TorrentFile {
    name: string;
    length: number;
    createReadStream(opts?: { start?: number; end?: number }): NodeJS.ReadableStream;
  }

  export interface Torrent {
    files: TorrentFile[];
    progress: number;
    destroy(): void;
    on(event: "download" | "error" | "done", listener: (...args: unknown[]) => void): void;
  }

  export default class WebTorrent {
    constructor();
    add(
      torrentId: string | Buffer | File,
      opts?: { announce?: string[]; destroyStoreOnDestroy?: boolean },
      onTorrent?: (torrent: Torrent) => void,
    ): Torrent;
    destroy(): void;
  }
}
