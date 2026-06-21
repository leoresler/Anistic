import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Link as LinkIcon, Magnet, RadioTower } from "lucide-react";
import { Link } from "react-router-dom";

import { addonApi, type Stream } from "../../lib/api";
import { useElectron } from "../../hooks/useElectron";
import { SkeletonCard } from "../SkeletonCard";

type StreamSelectorProps = {
  malId: number;
  season: number;
  episode: number;
  onStreamSelect: (stream: Stream) => void;
  onTorrentSelect?: (stream: Stream) => void;
};

const typeLabel = { hls: "HLS", mp4: "MP4", unknown: "Desconocido", torrent: "Torrent" } satisfies Record<Stream["type"], string>;

const streamUrlOrMagnet = (stream: Stream): string => (stream.type === "torrent" ? stream.magnet : stream.url);

const groupStreamsByAddon = (streams: Stream[]) =>
  streams.reduce<Map<string, Stream[]>>((groups, stream) => {
    groups.set(stream.addonName, [...(groups.get(stream.addonName) ?? []), stream]);
    return groups;
  }, new Map());

const openTorrent = (magnet: string, onUsed?: () => void) => {
  void navigator.clipboard.writeText(magnet).then(() => onUsed?.());
  window.open(magnet, "_blank", "noopener,noreferrer");
};

const parseInfoHashFromMagnet = (magnet: string): string | null => {
  const match = /^magnet:\?xt=urn:btih:([a-f0-9]{40})/i.exec(magnet);
  return match?.[1] ?? null;
};

export const StreamSelector = ({ malId, season, episode, onStreamSelect, onTorrentSelect }: StreamSelectorProps) => {
  const { isDesktop, bridge } = useElectron();
  const streamsQuery = useQuery({
    queryKey: ["addon-streams", malId, season, episode],
    queryFn: () => addonApi.streams({ malId, season, episode }),
  });

  const streamsByAddon = groupStreamsByAddon(streamsQuery.data?.streams ?? []);

  const handleTorrentClick = (stream: Stream & { type: "torrent" }) => {
    if (isDesktop) {
      onTorrentSelect?.(stream);
      return;
    }
    openTorrent(stream.magnet, () => onTorrentSelect?.(stream));
  };

  return (
    <section className="rounded-4xl border border-anime-border bg-anime-surface/85 p-5 text-cream-primary shadow-2xl shadow-black/20 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.26em] text-sabio">Streams</p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">Fuentes disponibles</h2>
        </div>
        {streamsQuery.isFetching ? <RadioTower className="animate-pulse text-sabio" /> : null}
      </div>

      {streamsQuery.isLoading ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}

      {streamsQuery.error ? (
        <div className="mt-5 rounded-3xl border border-red-400/20 bg-red-500/10 p-4 font-bold text-red-100">No pudimos cargar streams: {streamsQuery.error.message}</div>
      ) : null}

      {streamsQuery.data ? (
        <div className="mt-5 space-y-5">
            <div className="grid gap-2">
            {streamsQuery.data.addonResults.map((result) => (
              <div key={result.addonName} className="flex items-center justify-between gap-3 rounded-2xl border border-anime-border bg-anime-input px-4 py-3 text-sm font-bold">
                <span>{result.addonName}</span>
                <span className={result.status === "ok" ? "text-sabio" : "text-red-200"}>
                  {result.status === "ok" ? `${result.streamCount} streams` : `Falló: ${result.error}`}
                </span>
              </div>
            ))}
          </div>

          {streamsByAddon.size > 0 ? (
            [...streamsByAddon.entries()].map(([addonName, streams]) => (
              <div key={addonName}>
                <h3 className="mb-3 text-sm font-black uppercase tracking-[0.22em] text-cream-primary/55">{addonName}</h3>
                <div className="grid gap-3">
                  {streams.map((stream) => (
                    <button
                      key={`${stream.addonName}-${stream.title}-${streamUrlOrMagnet(stream)}`}
                      type="button"
                      onClick={() =>
                        stream.type === "torrent" ? handleTorrentClick(stream) : onStreamSelect(stream)
                      }
                      className="rounded-3xl border border-anime-border bg-anime-input p-4 text-left text-cream-primary transition hover:border-sabio-dim hover:bg-anime-main"
                    >
                      <span className="flex items-center gap-2 font-black">
                        {stream.type === "torrent" ? <Magnet size={16} className="text-sabio" /> : null}
                        {stream.title}
                        {stream.type === "torrent" ? (
                          <span className="ml-auto text-xs font-black uppercase tracking-[0.16em] text-cream-primary/60">
                            {isDesktop ? "(desktop)" : "(externo)"}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-3 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.16em]">
                        <span className="rounded-full bg-sabio px-3 py-1 text-anime-main">{stream.resolution}</span>
                        <span className="rounded-full border border-cream-primary/15 px-3 py-1 text-cream-primary/80">{typeLabel[stream.type]}</span>
                        {stream.language ? <span className="rounded-full border border-cream-primary/15 px-3 py-1 text-cream-primary/80">{stream.language}</span> : null}
                        {stream.subtitles?.length ? <span className="rounded-full border border-cream-primary/15 px-3 py-1 text-cream-primary/80">Subs: {stream.subtitles.join(", ")}</span> : null}
                        {typeof stream.seeders === "number" ? <span className="rounded-full border border-cream-primary/15 px-3 py-1 text-cream-primary/80">Seeders {stream.seeders}</span> : null}
                        {stream.lastUsed ? <span className="rounded-full bg-sabio px-3 py-1 text-anime-main">Último usado</span> : null}
                        {stream.workedForUsers ? <span className="rounded-full border border-sabio/50 px-3 py-1 text-sabio">Funcionó para {stream.workedForUsers}</span> : null}
                        {stream.type === "torrent" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-sabio/50 px-3 py-1 text-sabio">
                            <ExternalLink size={12} /> Copiar y abrir
                          </span>
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-anime-border bg-anime-input p-6 text-center">
              <p className="text-xl font-black text-cream-primary">No encontramos streams para este episodio.</p>
              <Link
                to="/addons"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-sabio px-5 py-3 font-black text-anime-main transition hover:bg-sabio-light"
              >
                <LinkIcon size={18} /> Configurar addons
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
};
