"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  X,
  MessageSquare,
  CheckSquare,
  FileText,
  ArrowRight,
  Video,
  Sparkles,
  ListMusic,
  Bell,
} from "lucide-react";
import { Meeting } from "@/types/meeting";
import { Playlist } from "@/types/playlist";
import { Tracker } from "@/types/tracker";

import { searchWorkspace, type SearchCategory, type SearchResult } from "@/lib/workspaceSearch";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetings: Meeting[];
  playlists?: Playlist[];
  trackers?: Tracker[];
  onSelectMeeting: (meetingId: string, timestamp?: number) => void;
  onSelectEntity: (tab: "playlists" | "alerts", id: string) => void;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-cyan-400/30 text-cyan-200 font-semibold px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  meetings,
  playlists = [],
  trackers = [],
  onSelectMeeting,
  onSelectEntity,
}) => {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SearchCategory>("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const results = useMemo(() => searchWorkspace(query, meetings, playlists, trackers), [query, meetings, playlists, trackers]);

  const filteredResults = useMemo(() => {
    if (activeCategory === "all") return results;
    if (activeCategory === "highlights") return results.filter((r) => r.type === "highlight");
    if (activeCategory === "transcripts") return results.filter((r) => r.type === "transcript");
    if (activeCategory === "action-items") return results.filter((r) => r.type === "actionItem");
    if (activeCategory === "summaries") return results.filter((r) => r.type === "summary");
    if (activeCategory === "meetings") return results.filter((r) => r.type === "meeting");
    if (activeCategory === "playlists") return results.filter((r) => r.type === "playlist");
    if (activeCategory === "trackers") return results.filter((r) => r.type === "tracker");
    return results;
  }, [results, activeCategory]);

  const handleSelectResult = (item: SearchResult) => {
    if (item.type === "playlist" || item.type === "tracker") {
      if (item.targetTab && item.entityId) onSelectEntity(item.targetTab, item.entityId);
      onClose();
    } else if (item.meetingId) {
      onSelectMeeting(item.meetingId, item.timestamp);
      onClose();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.target !== inputRef.current) {
      return;
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && filteredResults[selectedIndex]) {
      e.preventDefault();
      handleSelectResult(filteredResults[selectedIndex]);
    }
  };

  useEffect(() => {
    document.getElementById(`search-result-${selectedIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Search meetings" className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-16 px-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-[#131722] border border-[#2B3446] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#232B3B] gap-3">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            role="combobox"
            aria-label="Search workspace"
            aria-controls="search-results"
            aria-expanded={true}
            aria-activedescendant={filteredResults[selectedIndex] ? `search-result-${selectedIndex}` : undefined}
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search meetings, transcripts, actions, highlights..."
            className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              aria-label="Clear search"
              onClick={() => { setQuery(""); setSelectedIndex(0); inputRef.current?.focus(); }}
              className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button aria-label="Close search" onClick={onClose}>Close</button>
          <kbd className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-[#1B2230] border border-[#2A3446]">
            ESC
          </kbd>
        </div>

        {/* Filter Categories */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[#202736] bg-[#0F131C] overflow-x-auto text-xs">
          {[
            { id: "all", label: "All Results" },
            { id: "meetings", label: "Meetings" },
            { id: "transcripts", label: "Transcripts" },
            { id: "action-items", label: "Action Items" },
            { id: "summaries", label: "Summaries" },
            { id: "highlights", label: "Highlights" },
            { id: "playlists", label: "Playlists" },
            { id: "trackers", label: "Trackers" },
          ].map((cat) => (
            <button
              key={cat.id}
              aria-pressed={activeCategory === cat.id}
              onClick={() => {
                setActiveCategory(cat.id as SearchCategory);
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-md transition-colors font-medium whitespace-nowrap ${
                activeCategory === cat.id
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#19202D]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div id="search-results" role="listbox" aria-label="Search results" className="flex-1 overflow-y-auto p-2 divide-y divide-[#1D2433]">
          {!query.trim() ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Sparkles className="w-8 h-8 text-cyan-400/50 mx-auto mb-2.5" />
              <p className="font-medium text-slate-300">
                Search across all {meetings.length} meetings, {playlists.length} playlists, and {trackers.length} trackers
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Try searching for: <span className="text-cyan-400 font-mono">&ldquo;pricing&rdquo;</span>,{" "}
                <span className="text-cyan-400 font-mono">&ldquo;security&rdquo;</span>,{" "}
                <span className="text-cyan-400 font-mono">&ldquo;feedback&rdquo;</span>,{" "}
                <span className="text-cyan-400 font-mono">&ldquo;Sarah&rdquo;</span>
              </p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <p className="text-slate-300">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-[11px] text-slate-400 mt-1">Try another keyword or change the category filter.</p>
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const isSelected = selectedIndex === idx;

              let icon = <FileText className="w-4 h-4 text-cyan-400" />;
              if (item.type === "transcript") icon = <MessageSquare className="w-4 h-4 text-emerald-400" />;
              if (item.type === "actionItem") icon = <CheckSquare className="w-4 h-4 text-amber-400" />;
              if (item.type === "meeting") icon = <Video className="w-4 h-4 text-blue-400" />;
              if (item.type === "playlist") icon = <ListMusic className="w-4 h-4 text-purple-400" />;
              if (item.type === "tracker") icon = <Bell className="w-4 h-4 text-amber-400" />;

              return (
                <div
                  role="option"
                  id={`search-result-${idx}`}
                  aria-selected={isSelected}
                  key={`${item.meetingId || item.entityId}-${item.type}-${idx}`}
                  onClick={() => handleSelectResult(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 group ${
                    isSelected
                      ? "bg-cyan-500/10 border border-cyan-500/30 text-white"
                      : "hover:bg-[#181F2C] text-slate-300"
                  }`}
                >
                  <div className="p-2 rounded-lg bg-[#19202C] border border-[#273244] shrink-0 mt-0.5">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-xs font-semibold text-white truncate">
                          {highlightMatch(item.title, query.trim())}
                        </span>
                        {item.timestampFormatted && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            {item.timestampFormatted}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{item.dateFormatted}</span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {highlightMatch(item.snippet, query.trim())}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                      {item.meetingTitle && (
                        <>
                          <span className="font-medium text-slate-400">In: {item.meetingTitle}</span>
                          <span>•</span>
                        </>
                      )}
                      <span className="px-1.5 py-0.2 rounded bg-[#1C2330] text-slate-300 font-medium">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 shrink-0 self-center transition-colors" />
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-[#0E121A] border-t border-[#202736] flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              Use <kbd className="px-1 py-0.5 bg-[#1B212D] rounded border border-[#293244]">↑</kbd>{" "}
              <kbd className="px-1 py-0.5 bg-[#1B212D] rounded border border-[#293244]">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-[#1B212D] rounded border border-[#293244]">ENTER</kbd> to open
            </span>
          </div>
          <span className="font-medium text-cyan-400">{filteredResults.length} matches found</span>
        </div>
      </div>
    </div>
  );
};
