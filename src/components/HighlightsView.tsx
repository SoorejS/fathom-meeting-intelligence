"use client";

import React, { useState } from "react";
import { Highlight, HighlightType } from "@/types/meeting";
import { Play } from "lucide-react";

interface HighlightsViewProps {
  highlights: Highlight[];
  onSeek: (seconds: number) => void;
  onOpenCreateModal?: () => void;
}

export const HighlightsView: React.FC<HighlightsViewProps> = ({
  highlights,
  onSeek,
}) => {
  const [selectedType, setSelectedType] = useState<string>("All");

  const types = ["All", "Highlight", "Positive Reaction", "Needs Review", "Feedback"];

  const filteredHighlights = highlights.filter((h) => {
    if (selectedType === "All") return true;
    return h.type === selectedType;
  });

  const getTypeStyle = (type: HighlightType) => {
    switch (type) {
      case "Positive Reaction":
        return {
          pill: "border-[#10b981]/30 bg-[#10b981]/15 text-[#10b981]",
          square: "bg-[#10b981]",
          label: "POSITIVE REACTION",
        };
      case "Needs Review":
        return {
          pill: "border-[#f59e0b]/30 bg-[#f59e0b]/15 text-[#f59e0b]",
          square: "bg-[#f59e0b]",
          label: "NEEDS REVIEW",
        };
      case "Feedback":
        return {
          pill: "border-[#f97316]/30 bg-[#f97316]/15 text-[#f97316]",
          square: "bg-[#f97316]",
          label: "FEEDBACK",
        };
      default:
        return {
          pill: "border-[#00c2ff]/30 bg-[#00c2ff]/15 text-[#00c2ff]",
          square: "bg-[#00c2ff]",
          label: "HIGHLIGHT",
        };
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Header & Filter Pills */}
      <div className="flex items-center justify-between gap-2 pt-1 select-none">
        <span className="text-xs font-bold text-white tracking-wider">
          HIGHLIGHTS ({highlights.length})
        </span>

        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                selectedType === t
                  ? "bg-[#00c2ff]/20 text-[#00c2ff] border border-[#00c2ff]/40"
                  : "text-slate-400 hover:text-slate-200 border border-[#252834] bg-[#161820]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Highlights List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {filteredHighlights.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <p>No highlights logged in this category.</p>
          </div>
        ) : (
          filteredHighlights.map((h) => {
            const style = getTypeStyle(h.type);
            return (
              <div
                key={h.id}
                onClick={() => onSeek(h.timestamp)}
                className="p-3 rounded-xl bg-[#161820] hover:bg-[#1a1d26] border border-[#242734] hover:border-cyan-500/30 cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold tracking-wider ${style.pill}`}
                  >
                    <span className={`w-2 h-2 rounded-sm ${style.square}`} />
                    <span>{style.label}</span>
                  </span>

                  <span className="font-mono text-[10px] text-[#00c2ff] flex items-center gap-1 group-hover:underline">
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>{h.timestampFormatted}</span>
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed italic">
                  &ldquo;{h.text}&rdquo;
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-[#1f222d]">
                  <span>Logged by {h.creator}</span>
                  <span className="text-[#00c2ff] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    Play clip →
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
