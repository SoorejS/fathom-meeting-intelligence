"use client";

import { meetingShareUrl } from "@/lib/shareLinks";
import Image from "next/image";
import React, { useState } from "react";
import { Meeting } from "@/types/meeting";
import { X, Copy, Check, Link, Globe, Clock } from "lucide-react";

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
  const [copyError, setCopyError] = useState(false);

  if (!isOpen || !meeting) return null;

  const shareUrl = meetingShareUrl(meeting, includeTimestamp ? currentTimestamp : undefined);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setCopyError(false);
    } catch { setCopyError(true); }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Share meeting" onKeyDown={(event) => { if (event.key === "Escape") onClose(); }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#13151c] border border-[#262a36] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#20242f]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00c2ff]/10 border border-[#00c2ff]/30 flex items-center justify-center text-[#00c2ff]">
              <Link className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Share Call Recording</h3>
              <p className="text-[11px] text-slate-400">Share meeting notes & playback position</p>
            </div>
          </div>
          <button
            aria-label="Close share dialog"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4">
          {/* Meeting Summary Pill */}
          <div className="p-3 bg-[#171a23] border border-[#262a36] rounded-xl flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-white/10">
              <Image width={600} height={338} src={meeting.thumbnail} alt={meeting.title} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate">{meeting.title}</h4>
              <p className="text-[10px] text-slate-400">
                {meeting.dateFormatted} • {meeting.durationFormatted}
              </p>
            </div>
          </div>

          {/* Timestamp Toggle */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-[#171a23] border border-[#262a36] cursor-pointer group">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-[#00c2ff]" />
              <div>
                <p className="text-xs font-medium text-white">Start playback at current time</p>
                <p className="text-[10px] text-slate-400">
                  Starts at{" "}
                  <span className="font-mono text-[#00c2ff] font-semibold">
                    {formatSeconds(currentTimestamp)}
                  </span>
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={includeTimestamp}
              onChange={(e) => setIncludeTimestamp(e.target.checked)}
              className="w-4 h-4 rounded border-[#262a36] bg-[#0e1015] text-[#00c2ff] focus:ring-0 cursor-pointer accent-[#00c2ff]"
            />
          </label>

          {/* Access Permission Info */}
          <div className="flex items-center gap-2.5 p-2.5 bg-[#0e1015] rounded-xl border border-[#1f232d] text-xs text-slate-300">
            <Globe className="w-4 h-4 text-[#10b981] shrink-0" />
            <div className="flex-1 text-[11px]">
              <span className="font-semibold text-white">Anyone with the link can view</span>
              <p className="text-slate-400">Summary, synchronized transcript, and action items included</p>
            </div>
          </div>

          {copyError && <p role="alert" className="text-xs text-amber-300">Clipboard unavailable. Select and copy the link below.</p>}
          {/* Link Display and Copy */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-400">Shareable URL</label>
            <div className="flex items-center gap-2 bg-[#0e1015] border border-[#242834] rounded-xl p-1.5">
              <input
                type="text"
                readOnly
                aria-label="Shareable URL"
                value={shareUrl}
                className="min-w-0 flex-1 bg-transparent px-2 text-xs font-mono text-slate-300 focus:outline-none truncate select-all"
              />
              <button
                onClick={handleCopy}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                  copied
                    ? "bg-[#10b981] text-black shadow-emerald-500/20"
                    : "bg-[#00c2ff] hover:bg-[#00aee6] text-black shadow-cyan-500/20"
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
        <div className="p-3 bg-[#0e1015] border-t border-[#1f232d] text-center">
          <p className="text-[10px] text-slate-400">
            {meeting.testCall ? "This link includes the meeting title, date, duration and test scenario. Microphone audio stays private in this browser and is never included. Recipients see scenario notes with simulated playback." : "Recipients can explore this meeting without signing in. Personal highlights and completion changes stay in your browser; the link shares the original meeting and playback position."}
          </p>
        </div>
      </div>
    </div>
  );
};
