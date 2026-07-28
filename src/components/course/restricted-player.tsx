"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from "lucide-react";

// ==================== YouTube IFrame API — minimal type definitions ====================
interface YTPlayerVars {
  controls?: 0 | 1;
  disablekb?: 0 | 1;
  modestbranding?: 0 | 1;
  rel?: 0 | 1;
  iv_load_policy?: 1 | 3;
  fs?: 0 | 1;
  playsinline?: 0 | 1;
  origin?: string;
}

interface YTPlayerEvent {
  target: YTPlayer;
  data?: number;
}

interface YTPlayer {
  getDuration(): number;
  getCurrentTime(): number;
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  destroy(): void;
}

interface YTNamespace {
  Player: new (
    element: HTMLElement,
    config: {
      videoId: string;
      playerVars: YTPlayerVars;
      events: {
        onReady: (event: YTPlayerEvent) => void;
        onStateChange: (event: YTPlayerEvent) => void;
      };
    }
  ) => YTPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;
function loadYouTubeAPI(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => resolve();
  });
  return apiPromise;
}

function requestFs(el: HTMLElement): Promise<void> | undefined {
  const anyEl = el as any;
  if (el.requestFullscreen) return el.requestFullscreen();
  if (anyEl.webkitRequestFullscreen) return anyEl.webkitRequestFullscreen();
  if (anyEl.mozRequestFullScreen) return anyEl.mozRequestFullScreen();
  if (anyEl.msRequestFullscreen) return anyEl.msRequestFullscreen();
  return undefined;
}

function exitFs(): Promise<void> | undefined {
  const doc = document as any;
  if (document.exitFullscreen) return document.exitFullscreen();
  if (doc.webkitExitFullscreen) return doc.webkitExitFullscreen();
  if (doc.mozCancelFullScreen) return doc.mozCancelFullScreen();
  if (doc.msExitFullscreen) return doc.msExitFullscreen();
  return undefined;
}

function currentFsElement(): Element | null {
  const doc = document as any;
  return (
    document.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement ||
    null
  );
}

// ==================== Component ====================
interface Props {
  videoId: string;
  title: string;
  watermarkText?: string;
  onProgress?: (watchedFraction: number) => void;
}

export default function RestrictedPlayer({ videoId, title, watermarkText, onProgress }: Props) {
  const mountRef = useRef<HTMLDivElement>(null); // dedicated node the YT API is allowed to replace
  const wrapRef = useRef<HTMLDivElement>(null); // the element that actually goes fullscreen
  const playerRef = useRef<YTPlayer | null>(null);
  const maxWatchedRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useNativeFs, setUseNativeFs] = useState(true);

  useEffect(() => {
    let destroyed = false;
    loadYouTubeAPI().then(() => {
      if (destroyed || !mountRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(mountRef.current, {
        videoId,
        playerVars: {
          controls: 0, disablekb: 1, modestbranding: 1, rel: 0,
          iv_load_policy: 3, fs: 0, playsinline: 1,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        },
        events: {
          onReady: (e) => {
            setReady(true);
            setDuration(e.target.getDuration());
          },
          onStateChange: (e) => {
            setPlaying(e.data === window.YT?.PlayerState.PLAYING);
          },
        },
      });
    });
    return () => {
      destroyed = true;
      playerRef.current?.destroy?.();
    };
  }, [videoId]);

  useEffect(() => {
    if (!ready) return;
    const interval = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      const t = p.getCurrentTime();
      setCurrent(t);
      if (t > maxWatchedRef.current) {
        maxWatchedRef.current = t;
        if (duration > 0) onProgress?.(maxWatchedRef.current / duration);
      }
    }, 400);
    return () => clearInterval(interval);
  }, [ready, duration, onProgress]);

  // Detect real Fullscreen API support once, on mount (iOS Safari lacks it for non-video elements)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const anyEl = el as any;
    const supported = !!(
      el.requestFullscreen || anyEl.webkitRequestFullscreen || anyEl.mozRequestFullScreen || anyEl.msRequestFullscreen
    );
    setUseNativeFs(supported);
  }, []);

  // Listen for the browser's own fullscreen changes (covers exiting via back-gesture, ESC, etc.)
  useEffect(() => {
    function onFsChange() {
      const active = currentFsElement() === wrapRef.current;
      setIsFullscreen(active);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    document.addEventListener("mozfullscreenchange", onFsChange);
    document.addEventListener("MSFullscreenChange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      document.removeEventListener("mozfullscreenchange", onFsChange);
      document.removeEventListener("MSFullscreenChange", onFsChange);
    };
  }, []);

  // Orientation lock + scroll lock. Only attempt orientation lock once we're
  // actually in a real fullscreen element (that's a hard requirement on Android/Chrome).
  useEffect(() => {
    document.body.style.overflow = isFullscreen ? "hidden" : "";
    const orientation = (screen as any).orientation;
    if (isFullscreen && currentFsElement()) {
      orientation?.lock?.("landscape").catch(() => {
        /* Not supported on this device/browser — safe to ignore */
      });
    } else {
      orientation?.unlock?.();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !currentFsElement()) setIsFullscreen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFullscreen]);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo(); else p.playVideo();
  }, [playing]);

  const toggleMute = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (muted) { p.unMute(); setMuted(false); } else { p.mute(); setMuted(true); }
  }, [muted]);

  const toggleFullscreen = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = wrapRef.current;
    if (!el) return;

    if (useNativeFs) {
      if (currentFsElement()) {
        await exitFs();
      } else {
        try {
          await requestFs(el);
        } catch {
          // Some mobile browsers reject requestFullscreen outside a direct user
          // gesture chain — fall back to CSS pseudo-fullscreen for this session.
          setUseNativeFs(false);
          setIsFullscreen((v) => !v);
        }
      }
    } else {
      // CSS-only fallback (iOS Safari and any browser without element fullscreen support)
      setIsFullscreen((v) => !v);
    }
  }, [useNativeFs]);

  function seekTo(fraction: number) {
    const p = playerRef.current;
    if (!p || !duration) return;
    const target = fraction * duration;
    const clamped = target > maxWatchedRef.current ? maxWatchedRef.current : target;
    p.seekTo(clamped, true);
  }

  function fmt(sec: number) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const progressPct = duration ? (current / duration) * 100 : 0;
  const watchedPct = duration ? (maxWatchedRef.current / duration) * 100 : 0;

  return (
    <div
      ref={wrapRef}
      className="relative rounded-2xl overflow-hidden select-none restricted-player-root"
      style={
        isFullscreen
          ? {
              position: useNativeFs ? "relative" : "fixed",
              inset: useNativeFs ? undefined : 0,
              width: "100%",
              height: "100%",
              zIndex: useNativeFs ? undefined : 999999,
              borderRadius: 0,
              background: "#000",
            }
          : { position: "relative", aspectRatio: "16/9", background: "#000" }
      }
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Dedicated mount node — the YT API is allowed to fully replace THIS node with
          its own iframe. CSS below forces pointer-events:none on whatever it injects,
          so touches never reach YouTube's own UI (this is what stops the native
          share/seek/fullscreen gestures leaking through on Android/Samsung Internet). */}
      <div className="absolute inset-0 w-full h-full yt-mount-zone">
        <div ref={mountRef} className="w-full h-full" title={title} />
      </div>

      {/* This overlay captures ALL touch/click input instead of the iframe */}
      <div
        className="absolute inset-0"
        onClick={togglePlay}
        onContextMenu={(e) => e.preventDefault()}
        style={{ cursor: "pointer", touchAction: "manipulation", zIndex: 5 }}
      />

      {watermarkText && (
        <div
          className="absolute pointer-events-none select-none watermark-float"
          style={{
            color: "rgba(255,255,255,0.55)",
            fontSize: 13,
            fontWeight: 600,
            textShadow: "0 0 4px rgba(0,0,0,0.6)",
            zIndex: 20,
          }}
        >
          {watermarkText}
        </div>
      )}

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 6 }}>
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {ready && !playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 6 }}>
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 72, height: 72, background: "rgba(0,0,0,0.55)", border: "2px solid #a855f7" }}
          >
            <Play size={32} color="#a855f7" style={{ marginLeft: 4 }} />
          </div>
        </div>
      )}

      {ready && (
        <div
          className="absolute bottom-0 left-0 right-0 p-3"
          style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.75))", zIndex: 10 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="relative w-full h-1.5 rounded-full mb-2 cursor-pointer"
            style={{ background: "rgba(255,255,255,0.25)" }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const fraction = (e.clientX - rect.left) / rect.width;
              seekTo(Math.max(0, Math.min(1, fraction)));
            }}
          >
            <div className="absolute top-0 left-0 h-full rounded-full" style={{ width: `${watchedPct}%`, background: "rgba(255,255,255,0.4)" }} />
            <div className="absolute top-0 left-0 h-full rounded-full" style={{ width: `${progressPct}%`, background: "#a855f7" }} />
          </div>

          <div className="flex items-center gap-3 text-white">
            <button onClick={togglePlay} className="hover:opacity-80 transition-opacity" aria-label={playing ? "Pauza" : "Ijro etish"}>
              {playing ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button onClick={toggleMute} className="hover:opacity-80 transition-opacity" aria-label={muted ? "Ovozni yoqish" : "Ovozni o'chirish"}>
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>
              {fmt(current)} / {fmt(duration)}
            </span>
            <div className="flex-1" />
            <button onClick={toggleFullscreen} className="hover:opacity-80 transition-opacity" aria-label={isFullscreen ? "Kichraytirish" : "Kattalashtirish"}>
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .watermark-float {
          animation: floatWatermark 16s linear infinite;
        }
        @keyframes floatWatermark {
          0% { top: 10%; left: 5%; }
          25% { top: 70%; left: 60%; }
          50% { top: 20%; left: 75%; }
          75% { top: 60%; left: 15%; }
          100% { top: 10%; left: 5%; }
        }
        /* Forces YouTube's injected iframe to be fully non-interactive, no matter
           what element the IFrame API replaces our mount node with. This is what
           stops the native share sheet / seek-ahead / double-tap fullscreen from
           being reachable on mobile browsers like Samsung Internet. */
        .yt-mount-zone :global(iframe) {
          pointer-events: none !important;
          width: 100% !important;
          height: 100% !important;
        }
        :global(.restricted-player-root:fullscreen) {
          width: 100vw;
          height: 100vh;
        }
      `}</style>
    </div>
  );
}
