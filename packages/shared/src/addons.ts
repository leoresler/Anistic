import { z } from "zod";

import type { OkResponse } from "./events";

export const streamResolutions = ["1080p", "720p", "480p", "unknown"] as const;
export const streamTypes = ["hls", "mp4", "unknown", "torrent"] as const;

const magnetRegex = /^magnet:\?xt=urn:btih:[a-f0-9]{40}/i;

export const addonBodySchema = z.object({ url: z.string().url() });

export const addonStreamsQuerySchema = z.object({
  mal_id: z.coerce.number().int().positive(),
  season: z.coerce.number().int().positive().default(1),
  episode: z.coerce.number().int().positive(),
});

export const streamUsedSchema = z.object({
  malId: z.coerce.number().int().positive(),
  season: z.coerce.number().int().positive().default(1),
  episode: z.coerce.number().int().positive(),
  addonName: z.string().min(1),
  streamTitle: z.string().min(1),
  streamUrl: z.union([z.string().url(), z.string().regex(magnetRegex)]),
});

export const addonReportSchema = z.object({
  reason: z.string().trim().min(3).max(500).default("No funciona"),
});

export const addonManifestSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    version: z.string().min(1),
    resources: z.array(z.unknown()).min(1),
    types: z.array(z.string()).optional(),
    catalogs: z.array(z.unknown()).optional(),
  })
  .passthrough();

export type AddonBody = z.infer<typeof addonBodySchema>;
export type AddonStreamsQuery = z.infer<typeof addonStreamsQuerySchema>;
export type StreamUsedBody = z.infer<typeof streamUsedSchema>;
export type AddonReportBody = z.infer<typeof addonReportSchema>;
export type UserAddonManifest = z.infer<typeof addonManifestSchema>;

export type UserAddon = {
  id: string;
  userId: string;
  name: string;
  url: string;
  manifest: UserAddonManifest | null;
  createdAt: string;
};

export type BaseStream = {
  title: string;
  resolution: (typeof streamResolutions)[number];
  addonName: string;
  language?: string;
  subtitles?: string[];
  seeders?: number | null;
  lastUsed?: boolean;
  workedForUsers?: number;
};

export type UrlStream = BaseStream & {
  type: "hls" | "mp4" | "unknown";
  url: string;
};

export type TorrentStream = BaseStream & {
  type: "torrent";
  magnet: string;
  fileIdx?: number;
};

export type AddonStream = UrlStream | TorrentStream;

export type Stream = AddonStream;

export type AddonResult =
  | { addonName: string; status: "ok"; streamCount: number }
  | { addonName: string; status: "failed"; error: string };

export type StreamsResponse = {
  streams: Stream[];
  addonResults: AddonResult[];
};

export type StreamUsedResponse = {
  id: string;
};

export type RecommendedAddonsResponse = {
  recommended: UserAddon[];
  message: string;
};

export type RemoveAddonResponse = OkResponse;
export type ReportAddonResponse = OkResponse;
