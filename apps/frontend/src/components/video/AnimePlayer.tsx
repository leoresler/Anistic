import {
  FullscreenButton,
  MediaPlayer,
  MediaProvider,
  MuteButton,
  PlayButton,
  Time,
  TimeSlider,
  VolumeSlider,
  useMediaStore,
} from "@vidstack/react";
import { Maximize, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

type AnimePlayerProps = {
  src: string;
  type: "hls" | "mp4" | "unknown";
  resumeSeconds?: number;
  onProgress?: (currentTime: number, duration: number) => void;
  onCheckpoint?: (currentTime: number, duration: number) => void;
  onEnded?: (duration: number) => void;
};

const mediaType = (type: AnimePlayerProps["type"]): "video/mp4" | "application/x-mpegurl" => {
  if (type === "mp4") return "video/mp4";
  return "application/x-mpegurl";
};

const ControlButton = ({ children, label }: { children: ReactNode; label: string }) => (
  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full text-cream-primary transition hover:bg-white/10 hover:text-sabio" aria-hidden="true" title={label}>
    {children}
  </span>
);

const TimeScrubber = () => (
  <TimeSlider.Root className="group mb-3 flex h-8 w-full cursor-pointer items-center" aria-label="Progreso">
    <TimeSlider.Track className="relative h-1.5 w-full rounded-full bg-cream-primary/20">
      <TimeSlider.Progress className="absolute inset-y-0 left-0 rounded-full bg-cream-primary/20 will-change-[width]" />
      <TimeSlider.TrackFill className="absolute inset-y-0 left-0 rounded-full bg-sabio will-change-[width]" />
    </TimeSlider.Track>
    <TimeSlider.Thumb className="block h-4 w-4 rounded-full bg-sabio opacity-0 shadow-lg shadow-anime-main/50 ring-2 ring-cream-primary transition group-hover:opacity-100 group-data-dragging:opacity-100" />
  </TimeSlider.Root>
);

const VolumeControl = () => (
  <VolumeSlider.Root className="group hidden h-8 w-24 cursor-pointer items-center sm:flex" aria-label="Volumen">
    <VolumeSlider.Track className="relative h-1.5 w-full rounded-full bg-cream-primary/20">
      <VolumeSlider.TrackFill className="absolute inset-y-0 left-0 rounded-full bg-sabio will-change-[width]" />
    </VolumeSlider.Track>
    <VolumeSlider.Thumb className="block h-3.5 w-3.5 rounded-full bg-sabio opacity-0 ring-2 ring-cream-primary transition group-hover:opacity-100 group-data-dragging:opacity-100" />
  </VolumeSlider.Root>
);

const PlayerControls = () => {
  const { paused, muted } = useMediaStore();

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-anime-main to-transparent px-4 pb-4 pt-20">
      <TimeScrubber />

      <div className="flex items-center gap-3">
        <PlayButton className="contents" aria-label={paused ? "Reproducir" : "Pausar"}>
          <ControlButton label={paused ? "Reproducir" : "Pausar"}>{paused ? <Play size={22} fill="currentColor" /> : <Pause size={22} fill="currentColor" />}</ControlButton>
        </PlayButton>

        <div className="flex min-w-23 items-center gap-1 text-sm font-bold text-cream-primary">
          <Time type="current" />
          <span className="text-cream-primary/50">/</span>
          <Time type="duration" />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <MuteButton className="contents" aria-label={muted ? "Activar sonido" : "Silenciar"}>
            <ControlButton label={muted ? "Activar sonido" : "Silenciar"}>{muted ? <VolumeX size={21} /> : <Volume2 size={21} />}</ControlButton>
          </MuteButton>
          <VolumeControl />
          <FullscreenButton className="contents" aria-label="Pantalla completa">
            <ControlButton label="Pantalla completa">
              <Maximize size={21} />
            </ControlButton>
          </FullscreenButton>
        </div>
      </div>
    </div>
  );
};

export const AnimePlayer = ({ src, type, resumeSeconds = 0, onProgress, onCheckpoint, onEnded }: AnimePlayerProps) => {
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const source = useMemo(() => ({ src, type: mediaType(type) }), [src, type]);

  if (!src) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-4xl border border-cream-primary/10 bg-anime-main p-8 text-center text-cream-primary/70">
        Elegí un stream para empezar a reproducir.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-4xl border border-cream-primary/10 bg-anime-main shadow-2xl">
      {resumeSeconds > 5 ? <div className="absolute left-4 top-4 z-10 rounded-full bg-anime-main/80 px-4 py-2 text-sm font-black text-cream-primary backdrop-blur">Continuar desde {Math.floor(resumeSeconds / 60)}:{Math.floor(resumeSeconds % 60).toString().padStart(2, "0")}</div> : null}
      <MediaPlayer
        key={`${src}-${retryKey}`}
        src={source}
        playsInline
        onError={() => setHasError(true)}
        onLoadStart={() => setHasError(false)}
        onDurationChange={(nextDuration) => setDuration(nextDuration)}
        onTimeUpdate={(detail) => {
          setCurrentTime(detail.currentTime);
          onProgress?.(detail.currentTime, duration);
        }}
        onPause={() => onCheckpoint?.(currentTime, duration)}
        onEnded={() => onEnded?.(duration)}
        className="aspect-video w-full bg-anime-main"
      >
        <MediaProvider />
        <PlayerControls />
      </MediaPlayer>

      {hasError ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-anime-main/92 p-8 text-center text-cream-primary">
          <p className="max-w-md text-lg font-black">No se pudo reproducir este stream.</p>
          <button type="button" onClick={() => setRetryKey((value) => value + 1)} className="inline-flex items-center gap-2 rounded-full bg-sabio px-5 py-3 font-black text-anime-main">
            <RotateCcw size={18} /> Reintentar
          </button>
        </div>
      ) : null}
    </div>
  );
};
