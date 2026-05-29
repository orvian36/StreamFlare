"use client";

import * as React from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw, ChevronLeft } from "lucide-react";
import { Slider } from "@streamflare/ui/components/ui/slider";
import { cn } from "@streamflare/ui/lib/utils";

function fmt(t: number): string {
  if (!Number.isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  title: string;
  subtitle?: string;
  startAt?: number;
  onProgress?: (seconds: number) => void;
  onEnded?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  onNext?: () => void;
}

export function VideoPlayer(props: VideoPlayerProps) {
  const { src, poster, title, subtitle, startAt = 0, onProgress, onEnded, onBack, nextLabel, onNext } = props;
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [visible, setVisible] = React.useState(true);
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showControls = React.useCallback(() => {
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 3000);
  }, []);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { void v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
    showControls();
  }
  function skip(delta: number) {
    const v = videoRef.current;
    if (v) v.currentTime = Math.min(Math.max(0, v.currentTime + delta), duration || v.currentTime + delta);
    showControls();
  }
  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }
  function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }
  function seekTo(pctVal: number) {
    const v = videoRef.current;
    if (v && duration) { v.currentTime = (pctVal / 100) * duration; setCurrent(v.currentTime); }
  }

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key.toLowerCase() === "k") { e.preventDefault(); togglePlay(); }
      else if (e.key === "ArrowRight") skip(10);
      else if (e.key === "ArrowLeft") skip(-10);
      else if (e.key.toLowerCase() === "f") toggleFullscreen();
      else if (e.key.toLowerCase() === "m") toggleMute();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <div ref={containerRef} onMouseMove={showControls} className="relative h-dvh w-full overflow-hidden bg-black">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        title={title}
        className="h-full w-full object-contain"
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          setDuration(v.duration);
          if (startAt > 0 && startAt < v.duration) v.currentTime = startAt;
        }}
        onTimeUpdate={(e) => { setCurrent(e.currentTarget.currentTime); onProgress?.(e.currentTarget.currentTime); }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); onEnded?.(); }}
        onClick={togglePlay}
      />

      <div className={cn("pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-4 transition-opacity md:p-6", visible ? "opacity-100" : "opacity-0")}>
        <div className="pointer-events-auto flex items-center gap-3">
          <button type="button" aria-label="Back" onClick={onBack} className="grid size-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <ChevronLeft className="size-5" />
          </button>
          <div>
            <p className="font-display text-lg font-semibold text-white">{title}</p>
            {subtitle ? <p className="text-sm text-white/70">{subtitle}</p> : null}
          </div>
        </div>
      </div>

      {!playing ? (
        <button
          type="button"
          aria-label="Play"
          onClick={togglePlay}
          className="absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25"
        >
          <Play className="size-9" />
        </button>
      ) : null}

      <div className={cn("absolute inset-x-0 bottom-0 space-y-2 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity md:p-6", visible ? "opacity-100" : "opacity-0")}>
        <div className="flex items-center gap-3 text-xs text-white/80">
          <span className="font-mono tabular-nums">{fmt(current)}</span>
          <Slider value={[pct]} max={100} step={0.1} onValueChange={(v) => seekTo(v[0] ?? 0)} aria-label="Seek" className="flex-1" />
          <span className="font-mono tabular-nums">{fmt(duration)}</span>
        </div>
        <div className="flex items-center gap-2 text-white">
          <button type="button" aria-label={playing ? "Pause" : "Play"} onClick={togglePlay} className="grid size-10 place-items-center rounded-full hover:bg-white/10">
            {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
          </button>
          <button type="button" aria-label="Back 10 seconds" onClick={() => skip(-10)} className="grid size-10 place-items-center rounded-full hover:bg-white/10"><RotateCcw className="size-5" /></button>
          <button type="button" aria-label="Forward 10 seconds" onClick={() => skip(10)} className="grid size-10 place-items-center rounded-full hover:bg-white/10"><RotateCw className="size-5" /></button>
          <button type="button" aria-label={muted ? "Unmute" : "Mute"} onClick={toggleMute} className="grid size-10 place-items-center rounded-full hover:bg-white/10">
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
          <div className="ml-auto flex items-center gap-2">
            {nextLabel && onNext ? (
              <button type="button" onClick={onNext} className="rounded-md px-3 py-1.5 text-sm hover:bg-white/10">{nextLabel}</button>
            ) : null}
            <button type="button" aria-label="Fullscreen" onClick={toggleFullscreen} className="grid size-10 place-items-center rounded-full hover:bg-white/10"><Maximize className="size-5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
