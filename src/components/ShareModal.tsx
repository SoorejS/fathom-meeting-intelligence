"use client";

import React, { useState } from "react";
import { Meeting } from "@/types/meeting";
import { X, Copy, Check, Link, Globe, Shield, Clock, Video } from "lucide-react";

interface ShareModalProps {
  meeting: Meeting | null;
  isOpen: boolean;
  onClose: () => void;
  currentTimestamp?: number;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  meeting,
  isOpen,
  onClose,
  currentTimestamp = 0,
}) => {
  const [includeTimestamp, setIncludeTimestamp] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !meeting) return null;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://fathom.video";
  const shareUrl = includeTimestamp && currentTimestamp > 0
    ? `${baseUrl}/share/${meeting.id}?t=${Math.floor(currentTimestamp)}`
    : `${baseUrl}/share/${meeting.id}`;

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#131722] border border-[#2B3446] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#222A3A]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Link className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Share Recording & Notes</h3>
              <p className="text-[11px] text-slate-400">Create shareable link with AI intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4">
          {/* Meeting Summary Pill */}
          <div className="p-3 bg-[#171D29] border border-[#273244] rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-white/10">
              <img src={meeting.thumbnail} alt={meeting.title} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-white truncate">{meeting.title}</h4>
              <p className="text-[10px] text-slate-400">
                {meeting.dateFormatted} • {meeting.durationFormatted}
              </p>
            </div>
          </div>

          {/* Timestamp Toggle */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-[#171D29] border border-[#273244] cursor-pointer group">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              <div>
                <p className="text-xs font-medium text-white">Start playback at current time</p>
                <p className="text-[10px] text-slate-400">
                  Starts at <span className="font-mono text-cyan-300 font-semibold">{formatSeconds(currentTimestamp)}</span>
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={includeTimestamp}
              onChange={(e) => setIncludeTimestamp(e.target.checked)}
              className="w-4 h-4 rounded border-[#273244] bg-[#0E121A] text-cyan-500 focus:ring-0 cursor-pointer accent-cyan-500"
            />
          </label>

          {/* Access Permission Info */}
          <div className="flex items-center gap-2 p-2.5 bg-[#10141D] rounded-xl border border-[#202736] text-xs text-slate-300">
            <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex-1 text-[11px]">
              <span className="font-semibold text-white">Anyone with the link can view</span>
              <p className="text-slate-400">Summary, transcript, and action items included</p>
            </div>
          </div>

          {/* Link Display and Copy */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-400">Shareable URL</label>
            <div className="flex items-center gap-2 bg-[#0E121A] border border-[#262F41] rounded-xl p-1.5">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent px-2 text-xs font-mono text-slate-300 focus:outline-none truncate select-all"
              />
              <button
                onClick={handleCopy}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                  copied
                    ? "bg-emerald-500 text-black shadow-emerald-500/20"
                    : "bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/20"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0E121A] border-t border-[#202736] text-center">
          <p className="text-[10px] text-slate-400">
            Recipients can view the video, read the full transcript, and export action items.
          </p>
        </div>
      </div>
    </div>
  );
};
