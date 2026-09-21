"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { TranscriptSegment, HighlightType } from "@/types/meeting";
import { Search, Sparkles, Play, Plus, Check } from "lucide-react";

interface TranscriptViewProps {
  transcript: TranscriptSegment[];
  currentTime: number;
  onSeek: (seconds: number) => void;
  onAddHighlight: (timestamp: number, text: string, type: HighlightType) => void;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  transcript,
  currentTime,
  onSeek,
  onAddHighlight,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightModalSegment, setHighlightModalSegment] = useState<TranscriptSegment | null>(null);
  const [highlightType, setHighlightType] = useState<HighlightType>("Highlight");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  // Find currently active segment based on current playback time
  const activeSegment = useMemo(() => {
    for (let i = transcript.length - 1; i >= 0; i--) {
      if (currentTime >= transcript[i].timestamp) {
        return transcript[i];
      }
    }
    return transcript[0] || null;
  }, [transcript, currentTime]);

  // Filter transcript by local search
  const filteredTranscript = useMemo(() => {
    if (!searchQuery.trim()) return transcript;
    const q = searchQuery.toLowerCase();
    return transcript.filter(
      (t) => t.text.toLowerCase().includes(q) || t.speaker.toLowerCase().includes(q)
    );
  }, [transcript, searchQuery]);

  const handleCreateHighlight = () => {
    if (!highlightModalSegment) return;
    onAddHighlight(highlightModalSegment.timestamp, highlightModalSegment.text, highlightType);
    setHighlightModalSegment(null);
  };

  const copySegment = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#11151F] border border-[#202736] rounded-2xl overflow-hidden shadow-xl">
      {/* Transcript Header with in-page search */}
      <div className="p-3 border-b border-[#202736] bg-[#0E121A] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white">Full Transcript</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1A212E] text-slate-400 font-mono">
            {transcript.length} segments
          </span>
        </div>

        <div className="relative w-44 sm:w-52">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcript..."
            className="w-full pl-8 pr-3 py-1 bg-[#151A25] border border-[#262F42] rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/40"
          />
        </div>
      </div>

      {/* Transcript Segments List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 divide-y divide-[#1B2230]">
        {filteredTranscript.map((segment) => {
          const isActive = activeSegment?.id === segment.id;
          return (
            <div
              key={segment.id}
              ref={isActive ? activeSegmentRef : null}
              className={`pt-3 first:pt-0 group/segment rounded-xl p-2.5 transition-all duration-150 ${
                isActive
                  ? "bg-cyan-500/10 border border-cyan-500/30 shadow-inner"
                  : "hover:bg-[#151B27]"
              }`}
            >
              {/* Speaker Bar & Clickable Timestamp */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-full ${
                      segment.speakerColor || "bg-cyan-600"
                    } text-white flex items-center justify-center text-[8px] font-bold`}
                  >
                    {segment.speakerInitials || segment.speaker.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    {segment.speaker}
                  </span>
                  {segment.speakerRole && (
                    <span className="text-[10px] text-slate-400 hidden sm:inline">
                      • {segment.speakerRole}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {/* Quick Seek Button */}
                  <button
                    onClick={() => onSeek(segment.timestamp)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium text-cyan-400 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors"
                    title={`Seek player to ${segment.timestampFormatted}`}
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>{segment.timestampFormatted}</span>
                  </button>

                  {/* Add Highlight action */}
                  <button
                    onClick={() => setHighlightModalSegment(segment)}
                    className="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-[#1D2534] opacity-0 group-hover/segment:opacity-100 transition-opacity"
                    title="Create Highlight from this moment"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Spoken Text */}
              <p
                onClick={() => onSeek(segment.timestamp)}
                className={`text-xs leading-relaxed cursor-pointer transition-colors ${
                  isActive ? "text-white font-medium" : "text-slate-300 hover:text-white"
                }`}
              >
                {segment.text}
              </p>
            </div>
          );
        })}
      </div>

      {/* Inline Create Highlight Modal */}
      {highlightModalSegment && (
        <div className="p-3 bg-[#161C28] border-t border-[#273347] animate-in fade-in duration-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Create Highlight at {highlightModalSegment.timestampFormatted}</span>
            </span>
            <button
              onClick={() => setHighlightModalSegment(null)}
              className="text-[11px] text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <p className="text-[11px] text-slate-300 italic line-clamp-2 bg-[#0F131C] p-2 rounded border border-[#212A3B]">
            "{highlightModalSegment.text}"
          </p>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {(["Highlight", "Positive Reaction", "Needs Review", "Feedback"] as HighlightType[]).map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => setHighlightType(type)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      highlightType === type
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-[#1C2433] text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {type}
                  </button>
                )
              )}
            </div>

            <button
              onClick={handleCreateHighlight}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold transition-colors shadow-md"
            >
              Save Highlight
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
