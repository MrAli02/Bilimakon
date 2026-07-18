"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

// ==================== YouTube IFrame API — minimal type definitions ====================
interface YTPlayerVars {
  controls?: 0 | 1;
  disablekb?: 0 | 1;
  modestbranding?: 0 | 1;
  rel?: 0 | 1;
  iv_load_policy?: 1 | 3;
  fs?: 0 | 1;
  playsinline?: 0 | 1;
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

// ==================== Component ====================
interface Props {
  videoId: string;
  title: string;
}

export default function RestrictedPlayer({ videoId, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const maxWatchedRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let destroyed = false;
    loadYouTubeAPI().then(() => {
      if (destroyed || !containerRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          controls: 0, disablekb: 1, modestbranding: 1, rel: 0,
          iv_load_policy: 3, fs: 0, playsinline: 1,
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
      if (t > maxWatchedRef.current) maxWatchedRef.current = t;
    }, 400);
    return () => clearInterval(interval);
  }, [ready]);

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

function seekTo(fraction: number) {
    const p = playerRef.current;
    if (!p || !duration) return;
    const target = fraction * duration;
    // Agar ilgari ko'rilmagan joyga bossa — aynan ko'rilgan joyning oxiriga qaytaradi
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
    <div className="relative rounded-2xl overflow-hidden select-none" style={{ aspectRatio: "16/9", background: "#000" }}>
      {/* YouTube player (o'z boshqaruvlari yashirilgan) */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none" title={title} />

      {/* Shaffof qalqon — tashqi YouTube havolalariga bosishni to'sadi */}
      <div className="absolute inset-0" onClick={togglePlay} style={{ cursor: "pointer" }} />

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Custom boshqaruvlar */}
      {ready && (
        <div className="absolute bottom-0 left-0 right-0 p-3" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.75))" }}
          onClick={(e) => e.stopPropagation()}>
          <div
            className="relative w-full h-1.5 rounded-full mb-2 cursor-pointer"
            style={{ background: "rgba(255,255,255,0.25)" }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const fraction = (e.clientX - rect.left) / rect.width;
              seekTo(Math.max(0, Math.min(1, fraction)));
            }}>
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
          </div>
        </div>
      )}
    </div>
  );
}
