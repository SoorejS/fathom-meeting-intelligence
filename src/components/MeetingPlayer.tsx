"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Mic,
} from "lucide-react";
import { Highlight, Participant, HighlightType } from "@/types/meeting";

interface MeetingPlayerProps {
  duration: number; // in seconds
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  highlights: Highlight[];
  currentSpeaker?: Participant;
  allSpeakers: Participant[];
  meetingTitle: string;
}

export const MeetingPlayer: React.FC<MeetingPlayerProps> = ({
  duration,
  currentTime,
  onTimeUpdate,
  highlights,
  currentSpeaker,
  meetingTitle,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Playback loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentTime < duration) {
      interval = setInterval(() => {
        onTimeUpdate(Math.min(duration, currentTime + 0.5 * playbackSpeed));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, duration, playbackSpeed, onTimeUpdate]);

  const playing = isPlaying && currentTime < duration;
  const togglePlay = () => {
    if (currentTime >= duration) { onTimeUpdate(0); setIsPlaying(true); }
    else setIsPlaying(!isPlaying);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const skipSeconds = (seconds: number) => {
    const next = Math.max(0, Math.min(duration, currentTime + seconds));
    onTimeUpdate(next);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onTimeUpdate(ratio * duration);
  };

  const handleTimelineHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(ratio * duration);
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIndex]);
  };

  const getPipColor = (type: HighlightType) => {
    switch (type) {
      case "Positive Reaction":
        return "bg-[#10b981]";
      case "Needs Review":
        return "bg-[#f59e0b]";
      case "Feedback":
        return "bg-[#f97316]";
      default:
        return "bg-[#00c2ff]";
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div ref={playerRef} className="bg-[#12141a] border border-[#20232c] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
      {/* Video Simulation Canvas Screen (Matching Fathom Reference Screenshot) */}
      <div
        className="relative aspect-video w-full bg-gradient-to-br from-[#0a0c11] via-[#121622] to-[#181d2a] flex flex-col items-center justify-center overflow-hidden group select-none cursor-pointer"
        onClick={togglePlay}
      >
        {/* Subtle dot-matrix overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#1f2636_1px,transparent_1px)] [background-size:16px_16px] opacity-35 pointer-events-none" />

        {/* Video Speaker Avatar & Active Waves */}
        <div className="relative z-10 flex flex-col items-center space-y-3">
          <div className="relative">
            <div
              className={`absolute -inset-3 rounded-full bg-[#00c2ff]/20 blur-md transition-opacity duration-300 ${
                isPlaying ? "opacity-100 scale-105 animate-pulse" : "opacity-0"
              }`}
            />
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full ${
                currentSpeaker?.color || "bg-cyan-600"
              } text-white flex items-center justify-center text-xl sm:text-2xl font-bold shadow-2xl ring-4 ${
                isPlaying ? "ring-[#00c2ff]" : "ring-[#272d3d]"
              } transition-all duration-300`}
            >
              {currentSpeaker?.initials || "EB"}
            </div>
            {/* Speaking mic indicator badge */}
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#11141b] border border-[#2b3345] text-[#00c2ff] shadow-md">
              <Mic className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-white tracking-tight">
              {currentSpeaker?.name || "Emily Bowman"}
            </p>
            <p className="text-xs text-slate-400 font-medium">
              {currentSpeaker?.role || "Host (Demo)"}
            </p>
          </div>

          {/* Equalizer animation */}
          <div className="flex items-center gap-1 h-4 pt-0.5">
            <span
              className={`w-1 bg-[#00c2ff] rounded-full transition-all ${
                isPlaying ? "h-4 animate-wave-1" : "h-1 opacity-40"
              }`}
            />
            <span
              className={`w-1 bg-[#00c2ff] rounded-full transition-all ${
                isPlaying ? "h-3 animate-wave-2" : "h-1 opacity-40"
              }`}
            />
            <span
              className={`w-1 bg-[#00c2ff] rounded-full transition-all ${
                isPlaying ? "h-5 animate-wave-3" : "h-1 opacity-40"
              }`}
            />
            <span
              className={`w-1 bg-[#00c2ff] rounded-full transition-all ${
                isPlaying ? "h-3.5 animate-wave-4" : "h-1 opacity-40"
              }`}
            />
            <span
              className={`w-1 bg-[#00c2ff] rounded-full transition-all ${
                isPlaying ? "h-2 animate-wave-2" : "h-1 opacity-40"
              }`}
            />
          </div>
        </div>

        {/* Big center translucent play button when paused (Matching Screenshot) */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
              <Play className="w-7 h-7 fill-white ml-1 text-white" />
            </div>
          </div>
        )}

        {/* Top-left meeting tag */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-[#00c2ff]" />
          <span className="truncate max-w-[200px] font-medium">{meetingTitle}</span>
        </div>
      </div>

      {/* Scrubber Timeline Bar with Highlight Pips (Matching Screenshot) */}
      <div className="px-4 pt-2.5 pb-1 bg-[#0f1116]">
        <div
          role="slider"
          aria-label="Playback position"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={Math.floor(currentTime)}
          tabIndex={0}
          onKeyDown={(event) => { if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) { event.preventDefault(); if (event.key === "Home") onTimeUpdate(0); else if (event.key === "End") onTimeUpdate(duration); else skipSeconds(event.key === "ArrowRight" ? 10 : -10); } }}
          ref={timelineRef}
          onClick={handleTimelineClick}
          onMouseMove={handleTimelineHover}
          onMouseLeave={() => setHoverTime(null)}
          className="relative h-2 bg-[#232733] hover:h-2.5 rounded-full cursor-pointer transition-all duration-150 group/timeline"
        >
          {/* Played progress */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-[#00c2ff] rounded-full"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Scrubber thumb: Vertical line / thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md border-2 border-[#00c2ff] group-hover/timeline:scale-125 transition-transform"
            style={{ left: `calc(${progressPercent}% - 7px)` }}
          />

          {/* Highlight Marker Pips on Timeline */}
          {highlights.map((h) => {
            const pipPercent = duration > 0 ? (h.timestamp / duration) * 100 : 0;
            const pipColor = getPipColor(h.type);
            return (
              <div
                key={h.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onTimeUpdate(h.timestamp);
                }}
                title={`[${h.type}] ${h.timestampFormatted}: ${h.text}`}
                className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${pipColor} hover:scale-150 transition-transform z-10 shadow-sm`}
                style={{ left: `calc(${pipPercent}% - 4px)` }}
              />
            );
          })}

          {/* Hover Time Tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-7 -translate-x-1/2 bg-black/95 text-white text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/20 pointer-events-none z-20 shadow-lg"
              style={{ left: `${(hoverTime / duration) * 100}%` }}
            >
              {formatSeconds(hoverTime)}
            </div>
          )}
        </div>
      </div>

      {/* Player Bottom Controls (Matching Live Fathom 6b0e6e8c-3a51-4773-b1bd-bc28ac4ab733.png) */}
      <div className="px-3 py-2 bg-[#0f1116] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
        {/* Left: Speaker label + Volume + Time */}
        <div className="flex items-center gap-3">
          {/* Speaker label tag on bottom-left: ll Speaker Name (Demo) */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <span className="text-[#00c2ff] font-bold">ll</span>
            <span className="text-slate-300 truncate max-w-[140px]">
              {currentSpeaker?.name || "Speaker"} (Demo)
            </span>
          </div>

          {/* Volume toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
            )}
          </button>

          {/* Time display: 1:44 / 42:00 */}
          <div className="font-mono text-[11px] text-slate-300">
            <span className="text-white font-semibold">{formatSeconds(currentTime)}</span>
            <span className="text-slate-500 mx-1">/</span>
            <span className="text-slate-400">{formatSeconds(duration)}</span>
          </div>
        </div>

        {/* Center: Play/Pause button + Skip buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => skipSeconds(-10)}
            className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Rewind 10s"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={togglePlay}
            className="p-1.5 rounded-full bg-[#00c2ff] hover:bg-[#00b0e8] text-black transition-colors cursor-pointer shadow-md"
            title={playing ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={() => skipSeconds(10)}
            className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Forward 10s"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Speed pill + Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            onClick={cycleSpeed}
            className="px-2 py-0.5 rounded bg-[#1c202b] hover:bg-[#252a39] border border-[#2b3142] text-[11px] font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Cycle playback speed"
          >
            {playbackSpeed}x
          </button>

          <button
            onClick={async () => { if (document.fullscreenElement) await document.exitFullscreen(); else await playerRef.current?.requestFullscreen(); }}
            className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
