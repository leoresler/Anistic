import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Store from "electron-store";
import WebTorrent from "webtorrent";

import { createTorrentServer } from "./torrent-server.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const store = new Store();
const webtorrentClient = new WebTorrent();

let mainWindow: BrowserWindow | null = null;
let torrentServer: Awaited<ReturnType<typeof createTorrentServer>> | null = null;

const FRONTEND_DEV_URL = "http://localhost:5173";

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (app.isPackaged) {
    window.loadFile(path.join(__dirname, "../../frontend/dist/index.html"));
  } else {
    window.loadURL(FRONTEND_DEV_URL);
  }

  return window;
}

async function bootstrap(): Promise<void> {
  torrentServer = await createTorrentServer(webtorrentClient, (infoHash, progress) => {
    mainWindow?.webContents.send("torrent:progress", { infoHash, progress });
  });

  ipcMain.on("store:get", (event, { key }: { key: string }) => {
    try {
      event.returnValue = store.get(key) ?? null;
    } catch {
      event.returnValue = null;
    }
  });

  ipcMain.on("store:set", (_event, { key, value }: { key: string; value: unknown }) => {
    try {
      store.set(key, value);
    } catch {
      console.warn(`[electron-store] failed to set key "${key}"`);
    }
  });

  ipcMain.handle("torrent:stream", async (_event, { infoHash }: { infoHash: string }) => {
    if (!torrentServer) {
      throw new Error("Torrent server not ready");
    }
    const url = await torrentServer.startStream(infoHash);
    return { port: torrentServer.port, url };
  });

  ipcMain.on("torrent:destroy", (_event, { infoHash }: { infoHash: string }) => {
    torrentServer?.destroyTorrent(infoHash);
  });

  ipcMain.on("app:get-port", (event) => {
    event.returnValue = torrentServer?.port ?? 0;
  });

  mainWindow = createWindow();
}

app.whenReady().then(bootstrap);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    mainWindow = createWindow();
  }
});

app.on("before-quit", async () => {
  if (torrentServer) {
    await torrentServer.close();
    torrentServer = null;
  }
  webtorrentClient.destroy();
});
