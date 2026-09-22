"use client";

import React, { useState, useMemo, useRef } from "react";
import { TranscriptSegment, HighlightType } from "@/types/meeting";
import { Search, Play, Plus, MoreHorizontal, Sparkles } from "lucide-react";

import { CustomHighlightType } from "@/types/settings";
import { DEFAULT_HIGHLIGHT_TYPES } from "@/services/settingsService";

interface TranscriptViewProps {
  highlightTypes?: CustomHighlightType[];
  transcript: TranscriptSegment[];
  currentTime: number;
  onSeek: (seconds: number) => void;
  onAddHighlight: (timestamp: number, text: string, type: HighlightType) => void;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  highlightTypes = DEFAULT_HIGHLIGHT_TYPES,
  transcript,
  currentTime,
  onSeek,
  onAddHighlight,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightModalSegment, setHighlightModalSegment] = useState<TranscriptSegment | null>(null);
  const [highlightType, setHighlightType] = useState<HighlightType>(highlightTypes[0]?.name || "Highlight");
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

  React.useEffect(() => {
    if (activeSegmentRef.current && !searchQuery) {
      activeSegmentRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeSegment?.id, searchQuery]);

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
            className="w-full pl-9 pr-3 py-1.5 bg-[#252527] border border-[#343436] rounded-full text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00c2ff]/50 transition-colors"
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
              aria-current={isActive ? "true" : undefined}
              className="group flex items-start gap-2.5 relative"
            >
              {/* Left Gutter: Circular Cyan '+' Button on Hover */}
              <div className="w-7 shrink-0 flex items-center justify-center pt-2">
                <button
                  onClick={() => setHighlightModalSegment(segment)}
                  className="w-6 h-6 rounded-full border border-[#00c2ff] bg-[#00c2ff]/10 text-[#00c2ff] hover:bg-[#00c2ff] hover:text-black flex items-center justify-center transition-all opacity-60 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer shadow-md"
                  title="Create Highlight from this moment"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>

              {/* Segment Bubble Card */}
              <div
                onClick={() => onSeek(segment.timestamp)}
                role="button" tabIndex={0} aria-label={"Seek to " + segment.timestampFormatted + ", " + segment.speaker}
                onKeyDown={event => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {event.preventDefault();onSeek(segment.timestamp);} }}
                className={`flex-1 min-w-0 rounded-md p-3 transition-all cursor-pointer border ${
                  isActive
                    ? "bg-[#484a49] border-transparent"
                    : "bg-[#252527] hover:bg-[#303033] border-[#343436]"
                }`}
              >
                {/* Header: Speaker Name + Timestamp + Menu */}
                <div className="flex flex-wrap gap-2 items-center justify-between mb-1.5">
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
                <p className="text-sm text-slate-200 leading-relaxed font-normal select-text">
                  {segment.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inline Create Highlight Modal */}
      {highlightModalSegment && (
        <div className="p-3.5 bg-[#252527] border border-[#343436] rounded-xl animate-in fade-in zoom-in-95 duration-100 space-y-3 shadow-2xl">
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

          <p className="text-xs text-slate-300 italic line-clamp-2 bg-[#252527] p-2.5 rounded-lg border border-[#343436]">
            &ldquo;{highlightModalSegment.text}&rdquo;
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {highlightTypes.map((item) => (
                <button
                  key={item.name}
                  onClick={() => setHighlightType(item.name as HighlightType)}
                  style={highlightType === item.name ? {color:item.color,borderColor:item.color} : undefined}
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                    highlightType === item.name
                      ? "bg-white/10"
                      : "border-[#343436] text-slate-400 hover:text-white"
                  }`}
                >
                  {item.name}
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
