"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw, RotateCw } from "lucide-react";

// ==================== YouTube IFrame API ====================
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
  setPlaybackQuality?(quality: string): void;
  getAvailableQualityLevels?(): string[];
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
  const anyEl = el as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>;
    mozRequestFullScreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  };
  if (el.requestFullscreen) return el.requestFullscreen();
  if (anyEl.webkitRequestFullscreen) return anyEl.webkitRequestFullscreen();
  if (anyEl.mozRequestFullScreen) return anyEl.mozRequestFullScreen();
  if (anyEl.msRequestFullscreen) return anyEl.msRequestFullscreen();
  return undefined;
}

function exitFs(): Promise<void> | undefined {
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void>;
    mozCancelFullScreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
  };
  if (document.exitFullscreen) return document.exitFullscreen();
  if (doc.webkitExitFullscreen) return doc.webkitExitFullscreen();
  if (doc.mozCancelFullScreen) return doc.mozCancelFullScreen();
  if (doc.msExitFullscreen) return doc.msExitFullscreen();
  return undefined;
}

function currentFsElement(): Element | null {
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
    mozFullScreenElement?: Element | null;
    msFullscreenElement?: Element | null;
  };
  return (
    document.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement ||
    null
  );
}

function requestBestQuality(p: YTPlayer | null) {
  if (!p) return;
  try {
    const levels = p.getAvailableQualityLevels?.();
    const best = levels && levels.length > 0 ? levels[0] : "hd1080";
    p.setPlaybackQuality?.(best);
  } catch {}
}

// ==================== Component ====================
interface Props {
  videoId: string;
  title: string;
  initialWatchedSeconds?: number;
  watermarkText?: string;
  onProgress?: (watchedFraction: number, watchedSeconds: number) => void;
  allowFreeSeek?: boolean;
}

export default function RestrictedPlayer({
  videoId,
  title,
  initialWatchedSeconds = 0,
  watermarkText,
  onProgress,
  allowFreeSeek = false,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const maxWatchedRef = useRef(initialWatchedSeconds);
  const lastTimeRef = useRef(0);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useNativeFs, setUseNativeFs] = useState(true);

  // State va timerlarni tozalash
  useEffect(() => {
    maxWatchedRef.current = initialWatchedSeconds;
    lastTimeRef.current = 0;
    setCurrent(0);
    setDuration(0);
    setReady(false);
    setPlaying(false);
  }, [videoId, initialWatchedSeconds]);

  // YouTube API initialization
  useEffect(() => {
    let destroyed = false;
    loadYouTubeAPI().then(() => {
      if (destroyed || !mountRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(mountRef.current, {
        videoId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          fs: 0,
          playsinline: 1,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        },
        events: {
          onReady: (e) => {
            setReady(true);
            setDuration(e.target.getDuration());
            requestBestQuality(e.target);
          },
          onStateChange: (e) => {
            const isPlaying = e.data === window.YT?.PlayerState.PLAYING;
            setPlaying(isPlaying);
            if (isPlaying) requestBestQuality(playerRef.current);
          },
        },
      });
    });
    return () => {
      destroyed = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [videoId]);

  // Progress update
  useEffect(() => {
    if (!ready) return;
    const interval = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      const t = p.getCurrentTime();
      setCurrent(t);
      if (t > maxWatchedRef.current) {
        maxWatchedRef.current = t;
        if (duration > 0) {
          onProgress?.(maxWatchedRef.current / duration, Math.floor(maxWatchedRef.current));
        }
      }
    }, 400);
    return () => clearInterval(interval);
  }, [ready, duration, onProgress]);

  // Fullscreen va orientation nazorati
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const anyEl = el as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
      mozRequestFullScreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
    };
    setUseNativeFs(!!(el.requestFullscreen || anyEl.webkitRequestFullscreen || anyEl.mozRequestFullScreen || anyEl.msRequestFullscreen));
  }, []);

  useEffect(() => {
    function onFsChange() {
      const active = currentFsElement() === wrapRef.current;
      setIsFullscreen(active);
      if (active) requestBestQuality(playerRef.current);
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

  useEffect(() => {
    document.body.style.overflow = isFullscreen ? "hidden" : "";
    const orientation = (screen as Screen & { orientation?: { lock?: (o: string) => Promise<void>; unlock?: () => void } }).orientation;
    if (isFullscreen) {
      orientation?.lock?.("landscape").catch(() => {});
    } else {
      orientation?.unlock?.();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  // Tab fonga o'tganda videoni to'xtatish
  useEffect(() => {
    function handleVisibility() {
      const p = playerRef.current;
      if (!p) return;
      if (document.hidden) {
        try {
          lastTimeRef.current = p.getCurrentTime();
        } catch {}
        p.pauseVideo();
      } else {
        setTimeout(() => {
          try {
            const cur = p.getCurrentTime();
            if (Math.abs(cur - lastTimeRef.current) > 1) {
              p.seekTo(lastTimeRef.current, true);
            }
          } catch {}
          p.pauseVideo();
        }, 300);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

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
          setUseNativeFs(false);
          setIsFullscreen((v) => !v);
        }
      }
    } else {
      setIsFullscreen((v) => !v);
    }
  }, [useNativeFs]);

  function seekTo(fraction: number) {
    const p = playerRef.current;
    if (!p || !duration) return;
    const target = fraction * duration;
    const clamped = allowFreeSeek ? target : (target > maxWatchedRef.current ? maxWatchedRef.current : target);
    p.seekTo(clamped, true);
    if (clamped > maxWatchedRef.current) maxWatchedRef.current = clamped;
  }

  function seekBy(deltaSeconds: number) {
    const p = playerRef.current;
    if (!p || !duration) return;
    const target = Math.max(0, Math.min(duration, current + deltaSeconds));
    const clamped = allowFreeSeek ? target : (target > maxWatchedRef.current ? maxWatchedRef.current : target);
    p.seekTo(clamped, true);
    if (clamped > maxWatchedRef.current) maxWatchedRef.current = clamped;
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
      className={`relative rounded-2xl overflow-hidden select-none restricted-player-root ${
        isFullscreen ? "is-fullscreen" : ""
      }`}
      style={
        isFullscreen && !useNativeFs
          ? {
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 999999,
              borderRadius: 0,
              background: "#000",
            }
          : isFullscreen
          ? {
              width: "100%",
              height: "100%",
              borderRadius: 0,
              background: "#000",
            }
          : { position: "relative", aspectRatio: "16/9", background: "#000" }
      }
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Video Mount Zone */}
      <div className="yt-mount-zone">
        <div ref={mountRef} title={title} />
      </div>

      {/* Touch / Click Overlay */}
      <div
        className="absolute inset-0"
        onClick={togglePlay}
        onContextMenu={(e) => e.preventDefault()}
        style={{ cursor: "pointer", touchAction: "manipulation", zIndex: 5 }}
      />

      {/* Watermark */}
      {watermarkText && (
        <div
          className="absolute pointer-events-none select-none watermark-float"
          style={{
            top: "10%",
            left: "5%",
            color: "rgba(255,255,255,0.55)",
            fontSize: 13,
            fontWeight: 600,
            textShadow: "0 0 4px rgba(0,0,0,0.6)",
            zIndex: 30,
            whiteSpace: "nowrap",
          }}
        >
          {watermarkText}
        </div>
      )}

      {/* Loading Spinner */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 6 }}>
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Big Play Button on Pause */}
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

      {/* Custom Player Controls */}
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
            {allowFreeSeek && (
              <>
                <button
                  onClick={() => seekBy(-10)}
                  className="relative hover:opacity-80 transition-opacity flex items-center justify-center"
                  aria-label="10 soniya orqaga"
                  title="10 soniya orqaga"
                >
                  <RotateCcw size={18} />
                  <span className="absolute text-[8px] font-bold" style={{ top: "52%", left: "50%", transform: "translate(-50%,-50%)" }}>10</span>
                </button>
                <button
                  onClick={() => seekBy(20)}
                  className="relative hover:opacity-80 transition-opacity flex items-center justify-center"
                  aria-label="20 soniya oldinga"
                  title="20 soniya oldinga"
                >
                  <RotateCw size={18} />
                  <span className="absolute text-[8px] font-bold" style={{ top: "52%", left: "50%", transform: "translate(-50%,-50%)" }}>20</span>
                </button>
              </>
            )}
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

      {/* ABSOLUTE CSS FIX: YouTube inline o'lchamlari ustidan to'liq hukmronlik */}
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

        .yt-mount-zone {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          overflow: hidden !important;
          background: #000 !important;
        }

        /* 
          YouTube IFrame API tomonidan qo'yiladigan "width", "height", "top" va "left" 
          inline stillarini majburan bekor qilib, iframe'ni to'liq markazlashtirish:
        */
        .yt-mount-zone :global(iframe) {
          pointer-events: none !important;
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          width: 100% !important;
          height: 100% !important;
          max-width: none !important;
          max-height: none !important;
          border: 0 !important;
          background: #000 !important;
        }

        :global(.restricted-player-root:fullscreen),
        :global(.restricted-player-root:-webkit-full-screen) {
          width: 100vw !important;
          height: 100vh !important;
          background: #000 !important;
        }
      `}</style>
    </div>
  );
}