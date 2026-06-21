import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import type { Stream, UrlStream } from "@template/shared";

import { AnimePlayer } from "../../components/video/AnimePlayer";
import { StreamSelector } from "../../components/video/StreamSelector";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useTorrentStream } from "../../hooks/useTorrentStream";
import { addonApi, animeApi } from "../../lib/api";
import { WatchEpisodeControls } from "./components/WatchEpisodeControls";
import { WatchHeader } from "./components/WatchHeader";

const parsePositiveParam = (value: string | null, fallback: number) =>
  Math.max(1, Number.parseInt(value ?? String(fallback), 10) || fallback);
const parseInfoHashFromMagnet = (magnet: string): string | null => {
  const match = /^magnet:\?xt=urn:btih:([a-f0-9]{40})/i.exec(magnet);
  return match?.[1] ?? null;
};

export const WatchPage = () => {
  const { malId: malIdParam } = useParams<{ malId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const malId = useMemo(() => Number.parseInt(malIdParam ?? "", 10), [malIdParam]);
  const [season, setSeason] = useState(() => parsePositiveParam(searchParams.get("season"), 1));
  const [episode, setEpisode] = useState(() => parsePositiveParam(searchParams.get("episode"), 1));
  const [selectedStream, setSelectedStream] = useState<UrlStream | null>(null);
  const [activeTorrentInfoHash, setActiveTorrentInfoHash] = useState<string | null>(null);
  const lastSavedAt = useRef(0);
  const queryClient = useQueryClient();
  const torrentStream = useTorrentStream();

  const animeQuery = useQuery({
    queryKey: ["anime", malId],
    queryFn: () => animeApi.detail(malId),
    enabled: Number.isFinite(malId),
  });
  const progressQuery = useQuery({
    queryKey: ["anime-progress", malId],
    queryFn: () => animeApi.progress(malId),
    enabled: Number.isFinite(malId),
  });
  const saveProgress = useMutation({
    mutationFn: (payload: { progressSeconds: number; durationSeconds?: number; watched?: boolean }) =>
      animeApi.saveProgress(malId, { season, episode, ...payload }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["anime-progress", malId] }),
  });

  useDocumentTitle(animeQuery.data ? `Ver ${animeQuery.data.title} — Anistic` : "Reproductor — Anistic");

  useEffect(() => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("season", String(season));
        next.set("episode", String(episode));
        return next;
      },
      { replace: true },
    );
  }, [season, episode, setSearchParams]);

  const currentProgress = progressQuery.data?.progress.find((item) => item.season === season && item.episode === episode);
  const selectStream = useCallback(
    async (stream: Stream) => {
      if (stream.type === "torrent") {
        const infoHash = parseInfoHashFromMagnet(stream.magnet);
        if (infoHash) {
          try {
            const { url } = await torrentStream.start(infoHash);
            const localStream: UrlStream = { ...stream, type: "mp4", url };
            setSelectedStream(localStream);
            setActiveTorrentInfoHash(infoHash);
            void addonApi
              .markUsed({ malId, season, episode, addonName: stream.addonName, streamTitle: stream.title, streamUrl: url })
              .catch(() => undefined);
            return;
          } catch {
            // Fall through to browser-style handling.
          }
        }
        void addonApi
          .markUsed({ malId, season, episode, addonName: stream.addonName, streamTitle: stream.title, streamUrl: stream.magnet })
          .catch(() => undefined);
        return;
      }

      setSelectedStream(stream);
      void addonApi
        .markUsed({ malId, season, episode, addonName: stream.addonName, streamTitle: stream.title, streamUrl: stream.url })
        .catch(() => undefined);
    },
    [episode, malId, season, torrentStream],
  );
  const anime = animeQuery.data;
  const knownEpisodes = anime?.episodes && anime.episodes > 0 ? anime.episodes : null;
  const canGoPrevious = episode > 1;
  const canGoNext = !knownEpisodes || episode < knownEpisodes;

  const updateEpisode = useCallback(
    (nextEpisode: number, nextSeason = season) => {
      const safeEpisode = Math.max(1, nextEpisode);
      const safeSeason = Math.max(1, nextSeason);
      setEpisode(safeEpisode);
      setSeason(safeSeason);
      setSelectedStream(null);
    },
    [season],
  );

  useEffect(() => {
    setSelectedStream(null);
    lastSavedAt.current = 0;
    if (activeTorrentInfoHash) {
      torrentStream.destroy(activeTorrentInfoHash);
      setActiveTorrentInfoHash(null);
    }
  }, [season, episode, activeTorrentInfoHash, torrentStream]);

  const reportProgress = useCallback(
    (progressSeconds: number, durationSeconds: number, force = false) => {
      if (!Number.isFinite(progressSeconds) || progressSeconds < 1) return;
      const now = Date.now();
      if (!force && now - lastSavedAt.current < 12_000) return;
      lastSavedAt.current = now;
      saveProgress.mutate({
        progressSeconds: Math.floor(progressSeconds),
        durationSeconds: Number.isFinite(durationSeconds) ? Math.floor(durationSeconds) : undefined,
        watched: Number.isFinite(durationSeconds) && durationSeconds > 0 ? progressSeconds >= durationSeconds * 0.9 : undefined,
      });
    },
    [saveProgress],
  );

  const markWatched = useCallback(
    () =>
      saveProgress.mutate({
        progressSeconds: currentProgress?.progressSeconds ?? 0,
        durationSeconds: currentProgress?.durationSeconds,
        watched: true,
      }),
    [currentProgress, saveProgress],
  );

  if (!Number.isFinite(malId)) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-cream-primary">
        Anime inválido.
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-8 text-cream-primary">
      <section className="relative z-10 mx-auto max-w-6xl rounded-4xl border border-anime-border bg-anime-surface/85 p-5 shadow-2xl shadow-black/35 backdrop-blur sm:p-8">
        <WatchHeader
          malId={malId}
          animeTitle={anime?.title}
          season={season}
          episode={episode}
          selectedStreamTitle={selectedStream?.title}
          currentProgress={currentProgress}
        >
          <WatchEpisodeControls
            season={season}
            episode={episode}
            knownEpisodes={knownEpisodes}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            onUpdateEpisode={updateEpisode}
          />
        </WatchHeader>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={markWatched}
            className="rounded-full border border-anime-border bg-anime-input px-4 py-2 text-sm font-black text-cream-primary transition hover:border-sabio-dim"
          >
            Marcar visto
          </button>
          {saveProgress.isPending ? (
            <span className="rounded-full border border-anime-border bg-anime-input px-4 py-2 text-sm font-black text-cream-secondary">
              Guardando progreso...
            </span>
          ) : null}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <AnimePlayer
              src={selectedStream?.url ?? ""}
              type={selectedStream?.type ?? "unknown"}
              resumeSeconds={currentProgress?.progressSeconds ?? 0}
              onProgress={(currentTime, duration) => reportProgress(currentTime, duration)}
              onCheckpoint={(currentTime, duration) => reportProgress(currentTime, duration, true)}
              onEnded={(duration) =>
                saveProgress.mutate({
                  progressSeconds: Math.floor(duration || currentProgress?.progressSeconds || 0),
                  durationSeconds: Math.floor(duration || currentProgress?.durationSeconds || 0),
                  watched: true,
                })
              }
            />
          </div>
          <StreamSelector malId={malId} season={season} episode={episode} onStreamSelect={selectStream} onTorrentSelect={selectStream} />
        </div>
      </section>
    </main>
  );
};
