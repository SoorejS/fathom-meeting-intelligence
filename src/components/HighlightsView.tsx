"use client";

import React, { useState } from "react";
import { Highlight, HighlightType } from "@/types/meeting";
import { Sparkles, Play, ThumbsUp, AlertCircle, MessageSquare, Plus } from "lucide-react";

interface HighlightsViewProps {
  highlights: Highlight[];
  onSeek: (seconds: number) => void;
  onOpenCreateModal?: () => void;
}

export const HighlightsView: React.FC<HighlightsViewProps> = ({
  highlights,
  onSeek,
  onOpenCreateModal,
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
          badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          icon: <ThumbsUp className="w-3 h-3 text-emerald-400" />,
        };
      case "Needs Review":
        return {
          badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          icon: <AlertCircle className="w-3 h-3 text-amber-400" />,
        };
      case "Feedback":
        return {
          badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
          icon: <MessageSquare className="w-3 h-3 text-purple-400" />,
        };
      default:
        return {
          badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
          icon: <Sparkles className="w-3 h-3 text-cyan-400" />,
        };
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#11151F] border border-[#202736] rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-3.5 border-b border-[#202736] bg-[#0E121A] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white">Highlights</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {highlights.length} clips
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors whitespace-nowrap ${
                selectedType === t
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Highlights List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredHighlights.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <p>No highlights in this category.</p>
          </div>
        ) : (
          filteredHighlights.map((h) => {
            const style = getTypeStyle(h.type);
            return (
              <div
                key={h.id}
                onClick={() => onSeek(h.timestamp)}
                className="p-3.5 rounded-xl bg-[#141924] border border-[#242D3E] hover:border-cyan-500/40 cursor-pointer transition-all duration-150 group space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium border ${style.badge}`}
                  >
                    {style.icon}
                    <span>{h.type}</span>
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSeek(h.timestamp);
                    }}
                    className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 transition-colors"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>{h.timestampFormatted}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  "{h.text}"
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-[#1C2332]">
                  <span>Logged by {h.creator}</span>
                  <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
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
