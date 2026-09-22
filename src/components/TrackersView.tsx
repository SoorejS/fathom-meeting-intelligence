"use client";

import React, { useState, useMemo } from "react";
import { Meeting } from "@/types/meeting";
import { Tracker } from "@/types/tracker";
import { scanTranscriptMatches } from "@/services/trackerService";
import {
  Bell,
  Plus,
  Search,
  ExternalLink,
  Clock,
  Video,
  Tag,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Edit2,
  X,
  Filter,
} from "lucide-react";

interface TrackersViewProps {
  selectedTrackerId: string;
  onSelectTracker: (id: string) => void;
  trackers: Tracker[];
  meetings: Meeting[];
  onCreateTracker: (name: string, keywords: string[], meetingScope?: "all" | string[]) => void;
  onUpdateTracker: (id: string, patch: Partial<Tracker>) => void;
  onToggleTracker: (id: string) => void;
  onDeleteTracker: (id: string) => void;
  onNavigateMeeting: (meetingId: string, timestamp: number) => void;
}

export const TrackersView: React.FC<TrackersViewProps> = ({
  trackers,
  selectedTrackerId,
  onSelectTracker: setSelectedTrackerId,
  meetings,
  onCreateTracker,
  onUpdateTracker,
  onToggleTracker,
  onDeleteTracker,
  onNavigateMeeting,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [newKeywords, setNewKeywords] = useState<string[]>([]);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTrackerId, setEditingTrackerId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editKeywordInput, setEditKeywordInput] = useState("");
  const [editKeywords, setEditKeywords] = useState<string[]>([]);

  // Scan matches in real time across meetings
  const allMatches = useMemo(() => {
    return scanTranscriptMatches(trackers, meetings);
  }, [trackers, meetings]);

  // Filter matches by selected tracker and search query
  const filteredMatches = useMemo(() => {
    return allMatches.filter((match) => {
      if (selectedTrackerId !== "all" && match.trackerId !== selectedTrackerId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesKeyword = match.keyword.toLowerCase().includes(q);
        const matchesExcerpt = match.excerpt.toLowerCase().includes(q);
        const matchesSpeaker = match.speaker.toLowerCase().includes(q);
        const matchesMeeting = match.meetingTitle.toLowerCase().includes(q);
        if (!matchesKeyword && !matchesExcerpt && !matchesSpeaker && !matchesMeeting) {
          return false;
        }
      }
      return true;
    });
  }, [allMatches, selectedTrackerId, searchQuery]);

  // Keyword tag helpers
  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !newKeywords.includes(trimmed)) {
      setNewKeywords([...newKeywords, trimmed]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setNewKeywords(newKeywords.filter((k) => k !== kw));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const finalKeywords = [...newKeywords];
    if (keywordInput.trim() && !finalKeywords.includes(keywordInput.trim())) {
      finalKeywords.push(keywordInput.trim());
    }
    if (finalKeywords.length === 0) return;

    onCreateTracker(newName, finalKeywords, "all");
    setNewName("");
    setKeywordInput("");
    setNewKeywords([]);
    setIsCreateOpen(false);
  };

  const handleOpenEdit = (tracker: Tracker) => {
    setEditingTrackerId(tracker.id);
    setEditName(tracker.name);
    setEditKeywords([...tracker.keywords]);
    setEditKeywordInput("");
    setIsEditOpen(true);
  };

  const handleAddEditKeyword = () => {
    const trimmed = editKeywordInput.trim();
    if (trimmed && !editKeywords.includes(trimmed)) {
      setEditKeywords([...editKeywords, trimmed]);
      setEditKeywordInput("");
    }
  };

  const handleRemoveEditKeyword = (kw: string) => {
    setEditKeywords(editKeywords.filter((k) => k !== kw));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrackerId || !editName.trim()) return;
    const finalKeywords = [...editKeywords];
    if (editKeywordInput.trim() && !finalKeywords.includes(editKeywordInput.trim())) {
      finalKeywords.push(editKeywordInput.trim());
    }
    if (finalKeywords.length === 0) return;

    onUpdateTracker(editingTrackerId, {
      name: editName,
      keywords: finalKeywords,
    });
    setIsEditOpen(false);
  };

  // Helper to highlight keyword inside excerpt text
  const renderHighlightedExcerpt = (excerpt: string, keyword: string) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = excerpt.split(regex);
    return parts.map((part, index) =>
      part.toLowerCase() === keyword.toLowerCase() ? (
        <mark
          key={index}
          className="bg-amber-400/25 text-amber-300 font-semibold px-1 py-0.5 rounded border border-amber-400/40"
        >
          {part}
        </mark>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#090B0F]">
      {/* Left / Sidebar Column: Configured Trackers List */}
      <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-[#1E2431] bg-[#0E1117] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#1E2431] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              TRACKERS ({trackers.length})
            </h2>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Tracker</span>
          </button>
        </div>

        {/* Filter All option */}
        <div className="p-3 border-b border-[#1E2431]/60">
          <button
            onClick={() => setSelectedTrackerId("all")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              selectedTrackerId === "all"
                ? "bg-[#1C2230] text-amber-300 border border-amber-500/30"
                : "text-slate-300 hover:bg-[#141822] border border-transparent"
            }`}
          >
            <span className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" />
              <span>All Trackers</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#252C3D] text-slate-300">
              {allMatches.length} matches
            </span>
          </button>
        </div>

        {/* Trackers Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {trackers.map((tracker) => {
            const isSelected = selectedTrackerId === tracker.id;
            const trackerMatchesCount = allMatches.filter(
              (m) => m.trackerId === tracker.id
            ).length;

            return (
              <div
                key={tracker.id}
                onClick={() => setSelectedTrackerId(tracker.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? "bg-[#181D29] border-amber-500/40 shadow-sm"
                    : "bg-[#12151D] border-[#1F2430] hover:bg-[#151922] hover:border-slate-700"
                }`}
              >
                {/* Tracker Top Row */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white truncate flex-1 pr-2">
                    {tracker.name}
                  </span>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {/* Enable / Disable Toggle */}
                    <button
                      onClick={() => onToggleTracker(tracker.id)}
                      className={`text-xs ${
                        tracker.enabled ? "text-emerald-400" : "text-slate-500"
                      }`}
                      title={tracker.enabled ? "Enabled" : "Disabled"}
                    >
                      {tracker.enabled ? (
                        <ToggleRight className="w-5 h-5" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>
                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEdit(tracker)}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#202738]"
                      title="Edit tracker"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (confirm(`Delete tracker "${tracker.name}"?`)) {
                          onDeleteTracker(tracker.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-[#202738]"
                      title="Delete tracker"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Keywords Tag Badges */}
                <div className="flex flex-wrap gap-1">
                  {tracker.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#1D2332] text-slate-300 border border-[#2B3346]"
                    >
                      {kw}
                    </span>
                  ))}
                </div>

                {/* Match Counter Footer */}
                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-[#1C212E]">
                  <span className={tracker.enabled ? "text-slate-400" : "text-slate-500 italic"}>
                    {tracker.enabled ? "Scanning active" : "Paused"}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#202738] text-amber-400 font-semibold">
                    {trackerMatchesCount} {trackerMatchesCount === 1 ? "hit" : "hits"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Search Bar & Matches Feed */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Feed Header */}
        <div className="p-4 sm:p-6 border-b border-[#1E2431] bg-[#10131B] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              <span>
                {selectedTrackerId === "all"
                  ? "All Keyword Alert Matches"
                  : trackers.find((t) => t.id === selectedTrackerId)?.name || "Tracker unavailable in this browser"}
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Real-time keyword alerts extracted directly from recorded call transcripts. Click any match to seek to that moment.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search transcript hits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#1A1E29] border border-[#2B3244] focus:border-amber-500 rounded-lg text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Matches Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredMatches.length === 0 ? (
            <div className="p-10 rounded-2xl border border-dashed border-[#242C3D] bg-[#0E121A] text-center max-w-lg mx-auto my-12 space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
                <Tag className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">No keyword matches found</h3>
              <p className="text-xs text-slate-400">
                Ensure your trackers are enabled and contain keywords spoken in your customer or team recordings.
              </p>
            </div>
          ) : (
            filteredMatches.map((match, idx) => (
              <div
                key={`${match.trackerId}-${match.segmentId}-${match.keyword}-${idx}`}
                className="p-4 rounded-xl bg-[#12151D] border border-[#1E2330] hover:border-amber-500/40 hover:bg-[#151924] transition-all space-y-2.5 group"
              >
                {/* Match Metadata Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Tracker Name Pill */}
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-950/40 border border-amber-700/40 text-amber-300">
                      {match.trackerName}
                    </span>

                    {/* Matched Keyword Pill */}
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1C2232] border border-[#2B344B] text-cyan-300">
                      Keyword: &quot;{match.keyword}&quot;
                    </span>

                    {/* Speaker */}
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${match.speakerColor || "bg-cyan-500"}`} />
                      <span>{match.speaker}</span>
                    </span>

                    {/* Timestamp */}
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-1.5 py-0.5 rounded">
                      <Clock className="w-3 h-3" />
                      <span>{match.timestampFormatted}</span>
                    </span>
                  </div>

                  {/* Seek Button */}
                  <button
                    onClick={() => onNavigateMeeting(match.meetingId, match.timestamp)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-amber-300 hover:text-white bg-amber-950/30 hover:bg-amber-900/50 border border-amber-700/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Seek to Recording</span>
                  </button>
                </div>

                {/* Excerpt Quote */}
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal pl-2 border-l-2 border-amber-500/40">
                  {renderHighlightedExcerpt(match.excerpt, match.keyword)}
                </p>

                {/* Meeting Reference */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                  <Video className="w-3 h-3 text-slate-500" />
                  <span className="font-medium text-slate-300">{match.meetingTitle}</span>
                  <span>•</span>
                  <span>{match.meetingDate}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Tracker Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#131620] border border-[#222838] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Create Keyword Tracker</span>
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Tracker Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Executive Objections or Competitor Mentions"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#1A1E29] border border-[#2B3244] focus:border-amber-500 rounded-lg text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Keywords to Track</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type keyword and press Enter..."
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        handleAddKeyword();
                      }
                    }}
                    className="flex-1 px-3 py-2 text-xs bg-[#1A1E29] border border-[#2B3244] focus:border-amber-500 rounded-lg text-white placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    className="px-3 py-2 text-xs font-semibold text-white bg-[#222A3B] hover:bg-[#2A344A] rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>

                {/* Keywords Chips */}
                <div className="flex flex-wrap gap-1.5 pt-2 min-h-[36px]">
                  {newKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-950/50 border border-amber-700/50 text-amber-300"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(kw)}
                        className="hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {newKeywords.length === 0 && (
                    <span className="text-[11px] text-slate-500 italic">No keywords added yet.</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newKeywords.length === 0 && !keywordInput.trim()}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                >
                  Create Tracker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tracker Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#131620] border border-[#222838] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>Edit Tracker</span>
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Tracker Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#1A1E29] border border-[#2B3244] focus:border-amber-500 rounded-lg text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Keywords to Track</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add keyword..."
                    value={editKeywordInput}
                    onChange={(e) => setEditKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        handleAddEditKeyword();
                      }
                    }}
                    className="flex-1 px-3 py-2 text-xs bg-[#1A1E29] border border-[#2B3244] focus:border-amber-500 rounded-lg text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddEditKeyword}
                    className="px-3 py-2 text-xs font-semibold text-white bg-[#222A3B] hover:bg-[#2A344A] rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>

                {/* Keywords Chips */}
                <div className="flex flex-wrap gap-1.5 pt-2 min-h-[36px]">
                  {editKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-950/50 border border-amber-700/50 text-amber-300"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEditKeyword(kw)}
                        className="hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editKeywords.length === 0 && !editKeywordInput.trim()}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
