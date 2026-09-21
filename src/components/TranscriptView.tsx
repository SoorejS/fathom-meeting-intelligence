"use client";

import React, { useState, useMemo, useRef } from "react";
import { TranscriptSegment, HighlightType } from "@/types/meeting";
import { Search, Play, Plus, MoreHorizontal, Sparkles } from "lucide-react";

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
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  // Find currently active segment
  const activeSegment = useMemo(() => {
    for (let i = transcript.length - 1; i >= 0; i--) {
      if (currentTime >= transcript[i].timestamp) {
        return transcript[i];
      }
    }
    return transcript[0] || null;
  }, [transcript, currentTime]);

  // Filter transcript by search query
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

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Top Search Bar (Matching Live Fathom 6b0e6e8c-3a51-4773-b1bd-bc28ac4ab733.png) */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="text-xs text-slate-400 font-medium">
          {filteredTranscript.length} utterances synchronized
        </span>

        <div className="relative w-52 sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Transcript"
            className="w-full pl-9 pr-3 py-1.5 bg-[#171922] border border-[#272b38] rounded-full text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00c2ff]/50 transition-colors"
          />
        </div>
      </div>

      {/* Transcript Segments List with Left-Gutter Hover Highlight Button */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {filteredTranscript.map((segment) => {
          const isActive = activeSegment?.id === segment.id;
          return (
            <div
              key={segment.id}
              ref={isActive ? activeSegmentRef : null}
              className="group flex items-start gap-2.5 relative"
            >
              {/* Left Gutter: Circular Cyan '+' Button on Hover */}
              <div className="w-7 shrink-0 flex items-center justify-center pt-2">
                <button
                  onClick={() => setHighlightModalSegment(segment)}
                  className="w-6 h-6 rounded-full border border-[#00c2ff] bg-[#00c2ff]/10 text-[#00c2ff] hover:bg-[#00c2ff] hover:text-black flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
                  title="Create Highlight from this moment"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>

              {/* Segment Bubble Card */}
              <div
                onClick={() => onSeek(segment.timestamp)}
                className={`flex-1 rounded-xl p-3.5 transition-all cursor-pointer border ${
                  isActive
                    ? "bg-[#1c212c] border-[#00c2ff]/50 shadow-lg shadow-[#00c2ff]/5"
                    : "bg-[#161820] hover:bg-[#1a1d26] border-[#222530]"
                }`}
              >
                {/* Header: Speaker Name + Timestamp + Menu */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-tight">
                      {segment.speaker}
                    </span>
                    {segment.speakerRole && (
                      <span className="text-[10px] text-slate-400 hidden sm:inline">
                        • {segment.speakerRole}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 font-mono text-[10px] text-[#00c2ff] bg-[#00c2ff]/10 px-2 py-0.5 rounded border border-[#00c2ff]/20">
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>{segment.timestampFormatted}</span>
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setHighlightModalSegment(segment);
                      }}
                      className="text-slate-500 hover:text-white p-0.5 transition-colors"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Spoken Text */}
                <p className="text-xs text-slate-200 leading-relaxed font-normal select-text">
                  {segment.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inline Create Highlight Modal */}
      {highlightModalSegment && (
        <div className="p-3.5 bg-[#181b24] border border-[#2b3040] rounded-xl animate-in fade-in zoom-in-95 duration-100 space-y-3 shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#00c2ff]" />
              <span>Create Highlight at {highlightModalSegment.timestampFormatted}</span>
            </span>
            <button
              onClick={() => setHighlightModalSegment(null)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-slate-300 italic line-clamp-2 bg-[#12141c] p-2.5 rounded-lg border border-[#222736]">
            &ldquo;{highlightModalSegment.text}&rdquo;
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {(
                [
                  { type: "Highlight", color: "border-[#00c2ff]/40 text-[#00c2ff]" },
                  { type: "Positive Reaction", color: "border-[#10b981]/40 text-[#10b981]" },
                  { type: "Needs Review", color: "border-[#f59e0b]/40 text-[#f59e0b]" },
                  { type: "Feedback", color: "border-[#f97316]/40 text-[#f97316]" },
                ] as const
              ).map((item) => (
                <button
                  key={item.type}
                  onClick={() => setHighlightType(item.type as HighlightType)}
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                    highlightType === item.type
                      ? "bg-white/10 " + item.color
                      : "border-[#252a3a] text-slate-400 hover:text-white"
                  }`}
                >
                  {item.type}
                </button>
              ))}
            </div>

            <button
              onClick={handleCreateHighlight}
              className="px-3.5 py-1.5 rounded-lg bg-[#00c2ff] hover:bg-[#00aee6] text-black text-xs font-bold transition-colors shadow-md cursor-pointer"
            >
              Save Highlight
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
