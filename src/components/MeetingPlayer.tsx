"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize, Gauge, Mic, Sparkles } from "lucide-react";
import { Highlight, Participant } from "@/types/meeting";

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
  allSpeakers,
  meetingTitle,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Playback timer loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        onTimeUpdate(Math.min(duration, currentTime + 0.5 * playbackSpeed));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, duration, playbackSpeed, onTimeUpdate]);

  const togglePlay = () => setIsPlaying(!isPlaying);

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

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-[#10141D] border border-[#202736] rounded-2xl overflow-hidden flex flex-col shadow-xl">
      {/* Video Simulation Canvas Screen */}
      <div className="relative aspect-video w-full bg-gradient-to-br from-[#0c0f17] via-[#141824] to-[#181E2E] flex flex-col items-center justify-center overflow-hidden group select-none">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#1f2738_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

        {/* Video Speaker Active Tile */}
        <div className="relative z-10 flex flex-col items-center space-y-3">
          <div className="relative">
            {/* Glowing audio wave ring when playing */}
            <div
              className={`absolute -inset-2.5 rounded-full bg-cyan-500/20 blur-md transition-opacity duration-300 ${
                isPlaying ? "opacity-100 scale-105 animate-pulse" : "opacity-0"
              }`}
            />
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full ${
                currentSpeaker?.color || "bg-cyan-600"
              } text-white flex items-center justify-center text-xl sm:text-2xl font-bold shadow-2xl ring-4 ${
                isPlaying ? "ring-cyan-400" : "ring-[#273042]"
              } transition-all duration-300`}
            >
              {currentSpeaker?.initials || "AR"}
            </div>
            {/* Speaking mic indicator badge */}
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#11151F] border border-[#2B3547] text-cyan-400 shadow-md">
              <Mic className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-white tracking-tight">
              {currentSpeaker?.name || "Alex Rivera"}
            </p>
            <p className="text-xs text-slate-400 font-medium">
              {currentSpeaker?.role || "Speaker"}
            </p>
          </div>

          {/* Sound wave equalizer animation */}
          <div className="flex items-center gap-1 h-5 pt-1">
            <span className={`w-1 bg-cyan-400 rounded-full transition-all ${isPlaying ? "animate-wave-1" : "h-1 opacity-40"}`} />
            <span className={`w-1 bg-cyan-400 rounded-full transition-all ${isPlaying ? "animate-wave-2" : "h-1 opacity-40"}`} />
            <span className={`w-1 bg-cyan-300 rounded-full transition-all ${isPlaying ? "animate-wave-3" : "h-1 opacity-40"}`} />
            <span className={`w-1 bg-cyan-400 rounded-full transition-all ${isPlaying ? "animate-wave-4" : "h-1 opacity-40"}`} />
            <span className={`w-1 bg-cyan-300 rounded-full transition-all ${isPlaying ? "animate-wave-2" : "h-1 opacity-40"}`} />
          </div>
        </div>

        {/* Small tiles for other participants in call */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
          {allSpeakers
            .filter((s) => s.id !== currentSpeaker?.id)
            .slice(0, 3)
            .map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[11px] text-slate-300"
              >
                <div className={`w-4 h-4 rounded-full ${s.color} text-white flex items-center justify-center text-[8px] font-bold`}>
                  {s.initials}
                </div>
                <span className="truncate max-w-[80px]">{s.name.split(" ")[0]}</span>
              </div>
            ))}
        </div>

        {/* Meeting Watermark / Branding */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="truncate max-w-[180px] font-medium">{meetingTitle}</span>
        </div>

        {/* Big center click overlay */}
        <button
          onClick={togglePlay}
          className="absolute inset-0 z-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 focus:outline-none"
        >
          <div className="w-14 h-14 rounded-full bg-cyan-500/90 hover:bg-cyan-400 text-black flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform">
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-1" />
            )}
          </div>
        </button>
      </div>

      {/* Scrubber Timeline Bar with Highlight Pips */}
      <div className="px-4 pt-3 pb-1 bg-[#0E121A]">
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          onMouseMove={handleTimelineHover}
          onMouseLeave={() => setHoverTime(null)}
          className="relative h-2 bg-[#202738] hover:h-2.5 rounded-full cursor-pointer transition-all duration-150 group/timeline"
        >
          {/* Played progress */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Scrubber thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md border-2 border-cyan-500 group-hover/timeline:scale-125 transition-transform"
            style={{ left: `calc(${progressPercent}% - 7px)` }}
          />

          {/* Highlight Marker Pips on Timeline */}
          {highlights.map((h) => {
            const pipPercent = duration > 0 ? (h.timestamp / duration) * 100 : 0;
            return (
              <div
                key={h.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onTimeUpdate(h.timestamp);
                }}
                title={`Highlight at ${h.timestampFormatted}: ${h.text}`}
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400 hover:scale-150 hover:bg-amber-300 transition-transform z-10"
                style={{ left: `calc(${pipPercent}% - 4px)` }}
              />
            );
          })}

          {/* Hover Time Tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-7 -translate-x-1/2 bg-black/90 text-white text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/20 pointer-events-none z-20"
              style={{ left: `${(hoverTime / duration) * 100}%` }}
            >
              {formatSeconds(hoverTime)}
            </div>
          )}
        </div>
      </div>

      {/* Player Bottom Controls */}
      <div className="px-4 py-2.5 bg-[#0E121A] flex items-center justify-between gap-3 text-xs text-slate-300">
        {/* Left: Play/Pause, Skip, Time Display */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={togglePlay}
            className="p-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold transition-colors focus:outline-none"
            title={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => skipSeconds(-10)}
            className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
            title="Rewind 10 seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => skipSeconds(10)}
            className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
            title="Forward 10 seconds"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="font-mono text-[11px] text-slate-300 tracking-tight">
            <span className="text-white font-semibold">{formatSeconds(currentTime)}</span>
            <span className="text-slate-400 mx-1">/</span>
            <span>{formatSeconds(duration)}</span>
          </div>
        </div>

        {/* Right: Speed Toggle, Volume, Fullscreen */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Playback speed selector */}
          <div className="flex items-center gap-0.5 bg-[#171D29] border border-[#252E3E] rounded-md p-0.5">
            {[1, 1.25, 1.5, 2].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  playbackSpeed === spd
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Volume control */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }}
              className="w-16 h-1 bg-[#252E3E] rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
