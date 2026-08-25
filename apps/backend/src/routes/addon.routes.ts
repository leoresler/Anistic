import type { FastifyPluginAsync } from "fastify";
import { lookup } from "node:dns/promises";

import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { addonReports, animes, createDb, userAddons, userStreamHistory } from "@template/database";
import {
  addonBodySchema,
  addonManifestSchema,
  addonReportSchema,
  addonStreamsQuerySchema,
  streamUsedSchema,
  type AddonResult,
  type AddonStream,
  type AddonStreamsQuery,
  type TorrentStream,
  type UserAddonManifest,
  type UrlStream,
} from "@template/shared";

import { env } from "../env";
import { getAuthUserId, requireAuth } from "../lib/auth";
import { recordUserEvent } from "../services/event.service";

const { db } = createDb(env.DATABASE_URL);

const fetchJson = async (url: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Timeout al consultar el addon");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const normalizeAddonUrl = (input: string) => {
  const parsed = new URL(input.trim());
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("La URL debe usar HTTP o HTTPS");
  const url = parsed.toString().replace(/\/+$/, "");
  return url.endsWith("/manifest.json") ? url.slice(0, -"/manifest.json".length).replace(/\/+$/, "") : url;
};

const isPrivateIp = (address: string) =>
  /^10\./.test(address) ||
  /^127\./.test(address) ||
  /^169\.254\./.test(address) ||
  /^172\.(1[6-9]|2\d|3[0-1])\./.test(address) ||
  /^192\.168\./.test(address) ||
  address === "::1" ||
  address.toLowerCase().startsWith("fc") ||
  address.toLowerCase().startsWith("fd") ||
  address.toLowerCase().startsWith("fe80");

const validatePublicAddonUrl = async (url: string) => {
  const parsed = new URL(url);
  const hostname = parsed.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error("Por seguridad no se permiten addons en localhost o redes internas");
  }

  const addresses = await lookup(hostname, { all: true });
  if (addresses.some((entry) => isPrivateIp(entry.address))) {
    throw new Error("Por seguridad no se permiten addons que resuelven a IP privada o local");
  }
};

const resolutionFromTitle = (title: string): AddonStream["resolution"] => {
  const match = title.match(/(1080p|720p|480p)/i)?.[1]?.toLowerCase();
  return match === "1080p" || match === "720p" || match === "480p" ? match : "unknown";
};

const typeFromUrl = (url: string): UrlStream["type"] => {
  const cleanUrl = url.split("?")[0]?.toLowerCase() ?? "";
  if (cleanUrl.endsWith(".m3u8")) return "hls";
  if (cleanUrl.endsWith(".mp4")) return "mp4";
  return "unknown";
};

const encodeMagnetComponent = (value: string) => encodeURIComponent(value).replace(/%20/g, "+");

export const buildMagnet = (infoHash: string, title: string, sources: string[]): string => {
  if (!infoHash || !/^[a-f0-9]{40}$/i.test(infoHash)) return "";

  const params = [`xt=urn:btih:${infoHash.toLowerCase()}`, `dn=${encodeMagnetComponent(title || "Unknown")}`];
  for (const tracker of sources) {
    if (tracker) params.push(`tr=${encodeMagnetComponent(tracker)}`);
  }

  return `magnet:?${params.join("&")}`;
};

const languageFromTitle = (title: string) => {
  if (/\b(latino|latin)\b/i.test(title)) return "Latino";
  if (/\b(español|spanish)\b/i.test(title)) return "Español";
  if (/\b(castellano)\b/i.test(title)) return "Castellano";
  if (/\b(english|inglés)\b/i.test(title)) return "Inglés";
  if (/\b(japanese|japon[eé]s)\b/i.test(title)) return "Japonés";
  if (/\b(sub|subtitulado|subs)\b/i.test(title)) return "Subtitulado";
  return undefined;
};

const streamIdentifier = (stream: AddonStream): string => (stream.type === "torrent" ? stream.magnet : stream.url);

type StreamIdAnime = { imdbId?: string | null; kitsuId?: string | null } | null | undefined;

const getStreamIdPrefixes = (manifest: UserAddonManifest | null | undefined) => {
  const prefixes = new Set<string>();
  for (const resource of manifest?.resources ?? []) {
    if (!resource || typeof resource !== "object") continue;
    const record = resource as Record<string, unknown>;
    if (record.name !== "stream" || !Array.isArray(record.idPrefixes)) continue;
    for (const prefix of record.idPrefixes) {
      if (typeof prefix === "string") prefixes.add(prefix);
    }
  }
  return prefixes;
};

export const buildStreamIds = (manifest: UserAddonManifest | null | undefined, anime: StreamIdAnime, query: AddonStreamsQuery): string[] => {
  const prefixes = getStreamIdPrefixes(manifest);
  const hasUsablePrefixes = ["tt", "kitsu", "mal"].some((prefix) => prefixes.has(prefix));
  const ids: string[] = [];

  if (!hasUsablePrefixes) {
    if (anime?.kitsuId) ids.push(`kitsu:${anime.kitsuId}:${query.season}:${query.episode}`);
    if (anime?.imdbId) ids.push(`${anime.imdbId}:${query.season}:${query.episode}`);
    ids.push(`mal:${query.mal_id}:${query.season}:${query.episode}`);
    return ids;
  }

  if (prefixes.has("tt") && anime?.imdbId) ids.push(`${anime.imdbId}:${query.season}:${query.episode}`);
  if (prefixes.has("kitsu") && anime?.kitsuId) ids.push(`kitsu:${anime.kitsuId}:${query.season}:${query.episode}`);
  if (prefixes.has("mal")) ids.push(`mal:${query.mal_id}:${query.season}:${query.episode}`);
  return ids;
};

const normalizeAddonUrlForDedupe = (url: string) => {
  try {
    return normalizeAddonUrl(url);
  } catch {
    return url.trim().replace(/\/+$/, "");
  }
};

export const dedupeInstalledAddonsByUrl = <T extends { url: string }>(addons: T[]): T[] => {
  const seen = new Set<string>();
  return addons.filter((addon) => {
    const url = normalizeAddonUrlForDedupe(addon.url);
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
};

export const dedupeStreams = (streams: AddonStream[]): AddonStream[] => {
  const seen = new Set<string>();
  return streams.filter((stream) => {
    const key = `${stream.addonName}\u0000${stream.title}\u0000${streamIdentifier(stream)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const seedersFromStream = (stream: Record<string, unknown>, title: string) => {
  const direct = typeof stream.seeders === "number" ? stream.seeders : typeof stream.seeds === "number" ? stream.seeds : null;
  if (direct !== null) return direct;
  const match = title.match(/(?:👤|seeders?|seeds?|s:)\s*(\d+)/i);
  return match ? Number.parseInt(match[1] ?? "", 10) : null;
};

const subtitlesFromStream = (stream: Record<string, unknown>, title: string) => {
  const behaviorHints = typeof stream.behaviorHints === "object" && stream.behaviorHints ? (stream.behaviorHints as Record<string, unknown>) : {};
  const rawSubtitles = Array.isArray(stream.subtitles) ? stream.subtitles : Array.isArray(behaviorHints.subtitles) ? behaviorHints.subtitles : [];
  const subtitles = rawSubtitles
    .map((subtitle) => {
      if (typeof subtitle === "string") return subtitle;
      if (subtitle && typeof subtitle === "object") {
        const record = subtitle as Record<string, unknown>;
        return typeof record.lang === "string" ? record.lang : typeof record.language === "string" ? record.language : null;
      }
      return null;
    })
    .filter((subtitle): subtitle is string => Boolean(subtitle));

  if (subtitles.length > 0) return subtitles;
  return /\b(sub|subtitulado|subs)\b/i.test(title) ? ["Subtítulos"] : undefined;
};

export const extractStreams = (body: unknown, addonName: string): AddonStream[] => {
  const streams = z
    .object({ streams: z.array(z.record(z.string(), z.unknown())).optional() })
    .safeParse(body).data?.streams;

  return (streams ?? [])
    .map((stream) => {
      const url = typeof stream.url === "string" ? stream.url : null;
      const infoHash = typeof stream.infoHash === "string" ? stream.infoHash : null;

      const rawTitle =
        (typeof stream.title === "string" && stream.title) ||
        (typeof stream.name === "string" && stream.name) ||
        (typeof stream.description === "string" && stream.description) ||
        "";
      const title = rawTitle || "Stream sin título";

      const resolution = resolutionFromTitle(title);
      const language = languageFromTitle(title);
      const subtitles = subtitlesFromStream(stream, title);
      const seeders = seedersFromStream(stream, title);

      if (url) {
        const enriched: UrlStream = {
          title,
          url,
          resolution,
          addonName,
          type: typeFromUrl(url),
        };
        if (language) enriched.language = language;
        if (subtitles?.length) enriched.subtitles = subtitles;
        enriched.seeders = seeders;
        return enriched;
      }

      if (infoHash) {
        const sources = Array.isArray(stream.sources)
          ? stream.sources.filter((source): source is string => typeof source === "string")
          : [];
        const magnet = buildMagnet(infoHash, rawTitle, sources);
        if (!magnet) return null;

        const enriched: TorrentStream = {
          title,
          magnet,
          resolution,
          addonName,
          type: "torrent",
        };
        if (language) enriched.language = language;
        if (subtitles?.length) enriched.subtitles = subtitles;
        enriched.seeders = seeders;
        if (typeof stream.fileIdx === "number") enriched.fileIdx = stream.fileIdx;
        return enriched;
      }

      return null;
    })
    .filter((stream): stream is AddonStream => Boolean(stream));
};

const addonRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireAuth);

  app.post("/addons", async (request, reply) => {
    const { url } = addonBodySchema.parse(request.body);
    const userId = getAuthUserId(request);

    let normalizedUrl: string;
    let manifest: z.infer<typeof addonManifestSchema>;
    try {
      normalizedUrl = normalizeAddonUrl(url);
      await validatePublicAddonUrl(normalizedUrl);
      manifest = addonManifestSchema.parse(await fetchJson(`${normalizedUrl}/manifest.json`));
      const hasStreamResource = manifest.resources.some((resource) => {
        if (resource === "stream") return true;
        return Boolean(resource && typeof resource === "object" && (resource as Record<string, unknown>).name === "stream");
      });
      if (!hasStreamResource) throw new Error("El manifest no declara permisos de stream");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo validar el manifest del addon";
      return reply.status(400).send({ message: `Addon inválido: ${message}` });
    }

    const [created] = await db
      .insert(userAddons)
      .values({ userId, name: manifest.name, url: normalizedUrl, manifest })
      .returning();

    return reply.status(201).send(created);
  });

  app.get("/addons", async (request) => {
    const userId = getAuthUserId(request);
    return db.select().from(userAddons).where(eq(userAddons.userId, userId)).orderBy(desc(userAddons.createdAt));
  });

  app.get("/addons/recommended", async () => ({
    recommended: [],
    message: "No hay addons curados configurados todavía. Agregá solo addons de confianza y revisá sus permisos antes de usarlos.",
  }));

  app.delete("/addons/:id", async (request, reply) => {
    const userId = getAuthUserId(request);
    const { id } = request.params as { id: string };
    const [deleted] = await db
      .delete(userAddons)
      .where(and(eq(userAddons.id, id), eq(userAddons.userId, userId)))
      .returning({ id: userAddons.id });

    if (!deleted) return reply.status(404).send({ message: "Addon no encontrado" });
    return { ok: true };
  });

  app.get("/addons/streams", async (request) => {
    const userId = getAuthUserId(request);
    const query = addonStreamsQuerySchema.parse(request.query);

    const [addons, anime] = await Promise.all([
      db.select().from(userAddons).where(eq(userAddons.userId, userId)).orderBy(desc(userAddons.createdAt)),
      db.query.animes.findFirst({ where: eq(animes.malId, query.mal_id) }),
    ]);

    const uniqueAddons = dedupeInstalledAddonsByUrl(addons);

    const addonResponses = await Promise.allSettled(
      uniqueAddons.map(async (addon) => {
        const manifest = addonManifestSchema.safeParse(addon.manifest).data;
        const ids = buildStreamIds(manifest, anime, query);

        const attempts = await Promise.allSettled(
          ids.map(async (id) => extractStreams(await fetchJson(`${addon.url}/stream/series/${id}.json`), addon.name)),
        );
        const streams = attempts.flatMap((attempt) => (attempt.status === "fulfilled" ? attempt.value : []));

        return { addonName: addon.name, streams };
      }),
    );

    const streams: AddonStream[] = [];
    const addonResults: AddonResult[] = addonResponses.map((response, index) => {
      const addonName = uniqueAddons[index]?.name ?? "Addon";
      if (response.status === "rejected") {
        return { addonName, status: "failed", error: response.reason instanceof Error ? response.reason.message : "Error desconocido" };
      }

      streams.push(...response.value.streams);
      return { addonName, status: "ok", streamCount: response.value.streams.length };
    });
    const uniqueStreams = dedupeStreams(streams);

    if (anime && uniqueStreams.length > 0) {
      const [lastUsedRows, workedRows] = await Promise.all([
        db
          .select()
          .from(userStreamHistory)
          .where(and(eq(userStreamHistory.userId, userId), eq(userStreamHistory.animeId, anime.id), eq(userStreamHistory.season, query.season), eq(userStreamHistory.episode, query.episode)))
          .orderBy(desc(userStreamHistory.usedAt))
          .limit(10),
        db.execute<{ addon_name: string; stream_title: string; stream_url: string; users: number }>(sql`
          select addon_name, stream_title, stream_url, count(distinct user_id)::int as users
          from ${userStreamHistory}
          where anime_id = ${anime.id} and season = ${query.season} and episode = ${query.episode}
          group by addon_name, stream_title, stream_url
        `),
      ]);

      const lastUsedKeys = new Set(lastUsedRows.map((row) => `${row.addonName}\u0000${row.streamTitle}\u0000${row.streamUrl}`));
      const worked = new Map(workedRows.rows.map((row) => [`${row.addon_name}\u0000${row.stream_title}\u0000${row.stream_url}`, row.users]));
      for (const stream of uniqueStreams) {
        const key = `${stream.addonName}\u0000${stream.title}\u0000${streamIdentifier(stream)}`;
        stream.lastUsed = lastUsedKeys.has(key);
        stream.workedForUsers = worked.get(key) ?? 0;
      }
    }

    return { streams: uniqueStreams, addonResults };
  });

  app.post("/addons/streams/used", async (request, reply) => {
    const userId = getAuthUserId(request);
    const body = streamUsedSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ message: "Stream inválido" });

    const anime = await db.query.animes.findFirst({ where: eq(animes.malId, body.data.malId) });
    if (!anime) return reply.status(404).send({ message: "Anime no encontrado" });

    const [row] = await db
      .insert(userStreamHistory)
      .values({
        userId,
        animeId: anime.id,
        season: body.data.season,
        episode: body.data.episode,
        addonName: body.data.addonName,
        streamTitle: body.data.streamTitle,
        streamUrl: body.data.streamUrl,
      })
      .returning();

    await recordUserEvent({
      userId,
      animeId: anime.id,
      eventType: "stream_used",
      season: body.data.season,
      episode: body.data.episode,
      metadata: { addonName: body.data.addonName, streamTitle: body.data.streamTitle },
    });

    return reply.status(201).send(row);
  });

  app.post("/addons/:id/report", async (request, reply) => {
    const userId = getAuthUserId(request);
    const { id } = request.params as { id: string };
    const body = addonReportSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ message: "Motivo inválido" });

    const addon = await db.query.userAddons.findFirst({ where: and(eq(userAddons.id, id), eq(userAddons.userId, userId)) });
    if (!addon) return reply.status(404).send({ message: "Addon no encontrado" });

    await db.insert(addonReports).values({ userId, addonId: addon.id, addonUrl: addon.url, reason: body.data.reason });
    return { ok: true };
  });
};

export default addonRoutes;
