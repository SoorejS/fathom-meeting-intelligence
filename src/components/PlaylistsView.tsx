"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Meeting } from "@/types/meeting";
import { Playlist, ResolvedClip } from "@/types/playlist";
import { resolvePlaylistClips } from "@/services/playlistService";
import {
  ListMusic,
  Plus,
  Play,
  Share2,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  X,
  ExternalLink,
  Volume2,
  Pause,
  SkipForward,
  SkipBack,
  Check,
  Clock,
  Video,
} from "lucide-react";

interface PlaylistsViewProps {
  playlists: Playlist[];
  meetings: Meeting[];
  onCreatePlaylist: (title: string, description?: string) => Playlist;
  onRenamePlaylist: (id: string, title: string, description?: string) => void;
  onDeletePlaylist: (id: string) => void;
  onRemoveClip: (playlistId: string, clipId: string) => void;
  onReorderClips: (playlistId: string, clipId: string, direction: "up" | "down") => void;
  onNavigateMeeting: (meetingId: string, timestamp: number) => void;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  playlists,
  meetings,
  onCreatePlaylist,
  onRenamePlaylist,
  onDeletePlaylist,
  onRemoveClip,
  onReorderClips,
  onNavigateMeeting,
}) => {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(
    playlists[0]?.id || ""
  );

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameTitle, setRenameTitle] = useState("");
  const [renameDescription, setRenameDescription] = useState("");

  const [shareSuccess, setShareSuccess] = useState(false);

  // "Play All" Modal Player State
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [reelElapsed, setReelElapsed] = useState(0);
  const [reelPaused, setReelPaused] = useState(false);

  const activePlaylist = useMemo(() => {
    return playlists.find((p) => p.id === selectedPlaylistId) || playlists[0] || null;
  }, [playlists, selectedPlaylistId]);

  const resolvedClips: ResolvedClip[] = useMemo(() => {
    if (!activePlaylist) return [];
    return resolvePlaylistClips(activePlaylist, meetings);
  }, [activePlaylist, meetings]);

  const currentClip = resolvedClips[currentClipIndex];
  const clipDuration = currentClip ? Math.max(1, Math.min(15, (meetings.find(m => m.id === currentClip.meetingId)?.duration || 0) - currentClip.timestamp)) : 1;
  useEffect(() => {
    if (!isPlayingAll || reelPaused || !currentClip) return;
    const timer = setInterval(() => {
      if (reelElapsed + 1 >= clipDuration) {
        if (currentClipIndex < resolvedClips.length - 1) { setCurrentClipIndex(currentClipIndex + 1); setReelElapsed(0); }
        else { setReelElapsed(clipDuration); setReelPaused(true); }
      } else setReelElapsed(reelElapsed + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlayingAll, reelPaused, currentClip, currentClipIndex, resolvedClips.length, reelElapsed, clipDuration]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created = onCreatePlaylist(newTitle, newDescription);
    setSelectedPlaylistId(created.id);
    setNewTitle("");
    setNewDescription("");
    setIsCreateOpen(false);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTitle.trim() || !activePlaylist) return;
    onRenamePlaylist(activePlaylist.id, renameTitle, renameDescription);
    setIsRenameOpen(false);
  };

  const handleSharePlaylist = () => {
    if (!activePlaylist) return;
    const url = `${window.location.origin}/?playlist=${activePlaylist.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 3000);
  };

  const handleStartPlayAll = () => {
    if (resolvedClips.length === 0) return;
    setCurrentClipIndex(0);
    setReelElapsed(0); setReelPaused(false);
    setIsPlayingAll(true);
  };

  // Type styling helper
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "Positive Reaction":
        return "border-[#10b981]/30 bg-[#10b981]/15 text-[#10b981]";
      case "Needs Review":
        return "border-[#f59e0b]/30 bg-[#f59e0b]/15 text-[#f59e0b]";
      case "Feedback":
        return "border-[#f97316]/30 bg-[#f97316]/15 text-[#f97316]";
      default:
        return "border-[#00c2ff]/30 bg-[#00c2ff]/15 text-[#00c2ff]";
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#090B0F]">
      {/* Left Column: Playlists List / Selector */}
      <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-[#1E2431] bg-[#0E1117] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#1E2431] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">PLAYLISTS ({playlists.length})</h2>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Playlist</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {playlists.length === 0 ? (
            <div className="text-center py-10 px-4 text-xs text-slate-500">
              No playlists yet. Create one to curate clips across your calls!
            </div>
          ) : (
            playlists.map((pl) => {
              const isActive = activePlaylist?.id === pl.id;
              return (
                <div
                  key={pl.id}
                  onClick={() => setSelectedPlaylistId(pl.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#181C26] border-purple-500/40 shadow-sm"
                      : "bg-[#12151D] border-[#1F2430] hover:bg-[#151922] hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-white truncate flex-1">{pl.title}</h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#202533] text-purple-300 ml-2">
                      {pl.items.length} {pl.items.length === 1 ? "clip" : "clips"}
                    </span>
                  </div>
                  {pl.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                      {pl.description}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Active Playlist Details & Clips */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activePlaylist ? (
          <>
            {/* Playlist Header Controls */}
            <div className="p-4 sm:p-6 border-b border-[#1E2431] bg-[#10131B] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-lg sm:text-xl font-bold text-white truncate">{activePlaylist.title}</h1>
                  <button
                    onClick={() => {
                      setRenameTitle(activePlaylist.title);
                      setRenameDescription(activePlaylist.description || "");
                      setIsRenameOpen(true);
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#1C202C] transition-colors"
                    title="Rename playlist"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete playlist "${activePlaylist.title}"?`)) {
                        onDeletePlaylist(activePlaylist.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-[#1C202C] transition-colors"
                    title="Delete playlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {activePlaylist.description ? (
                  <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                    {activePlaylist.description}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 italic">No description provided.</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={handleStartPlayAll}
                  disabled={resolvedClips.length === 0}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:pointer-events-none rounded-lg shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play All ({resolvedClips.length})</span>
                </button>

                <button
                  onClick={handleSharePlaylist}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-[#1A1E29] hover:bg-[#232836] border border-[#2B3244] rounded-lg transition-colors cursor-pointer"
                >
                  {shareSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Share</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Clips List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {resolvedClips.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-[#242C3D] bg-[#0E121A] text-center max-w-lg mx-auto my-12 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 mx-auto flex items-center justify-center">
                    <ListMusic className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">This playlist has no clips yet</h3>
                  <p className="text-xs text-slate-400">
                    Open any meeting, navigate to the Highlights tab, and click &quot;Add to Playlist&quot; to build your highlight reel.
                  </p>
                </div>
              ) : (
                resolvedClips.map((clip, index) => (
                  <div
                    key={clip.clipId}
                    className="p-4 rounded-xl bg-[#12151D] border border-[#1E2330] hover:border-purple-500/40 hover:bg-[#151924] transition-all group relative"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      {/* Left: Clip Details */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {/* Order Index */}
                          <span className="w-5 h-5 rounded-full bg-[#1F2535] text-slate-300 flex items-center justify-center text-[10px] font-mono font-bold">
                            {index + 1}
                          </span>

                          {/* Highlight Type Pill */}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${getTypeBadge(
                              clip.highlightType
                            )}`}
                          >
                            {clip.highlightType}
                          </span>

                          {/* Timestamp Pill */}
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-1.5 py-0.5 rounded">
                            <Clock className="w-3 h-3" />
                            <span>{clip.timestampFormatted}</span>
                          </span>

                          {/* Source Meeting */}
                          <span className="text-xs text-slate-400 flex items-center gap-1 truncate">
                            <Video className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate font-medium text-slate-300">{clip.meetingTitle}</span>
                          </span>
                        </div>

                        {/* Highlight Quote/Text */}
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal pl-7">
                          &ldquo;{clip.highlightText}&rdquo;
                        </p>
                      </div>

                      {/* Right: Actions (Seek, Reorder, Remove) */}
                      <div className="flex items-center gap-1 sm:self-start pl-7 sm:pl-0 shrink-0">
                        {/* Jump to Source Meeting */}
                        <button
                          onClick={() => onNavigateMeeting(clip.meetingId, clip.timestamp)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-950/30 hover:bg-cyan-950/60 border border-cyan-800/40 rounded-lg transition-colors cursor-pointer"
                          title="Open meeting at this highlight timestamp"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Seek</span>
                        </button>

                        {/* Reorder Up */}
                        <button
                          onClick={() => onReorderClips(activePlaylist.id, clip.clipId, "up")}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-[#1E2433] transition-colors"
                          title="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>

                        {/* Reorder Down */}
                        <button
                          onClick={() => onReorderClips(activePlaylist.id, clip.clipId, "down")}
                          disabled={index === resolvedClips.length - 1}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-[#1E2433] transition-colors"
                          title="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>

                        {/* Remove from Playlist */}
                        <button
                          onClick={() => onRemoveClip(activePlaylist.id, clip.clipId)}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-[#1E2433] transition-colors"
                          title="Remove from playlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-slate-500 text-xs">
            Select or create a playlist to view clips.
          </div>
        )}
      </div>

      {/* Create Playlist Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#131620] border border-[#222838] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-purple-400" />
                <span>Create New Playlist</span>
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
                <label className="text-xs font-semibold text-slate-300">Playlist Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Objections Reel"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#1A1E29] border border-[#2B3244] focus:border-purple-500 rounded-lg text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Curate clips across customer calls..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#1A1E29] border border-[#2B3244] focus:border-purple-500 rounded-lg text-white placeholder-slate-500 focus:outline-none resize-none"
                />
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
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors cursor-pointer"
                >
                  Create Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Playlist Modal */}
      {isRenameOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#131620] border border-[#222838] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-purple-400" />
                <span>Rename Playlist</span>
              </h3>
              <button
                onClick={() => setIsRenameOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Playlist Name</label>
                <input
                  type="text"
                  required
                  value={renameTitle}
                  onChange={(e) => setRenameTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#1A1E29] border border-[#2B3244] focus:border-purple-500 rounded-lg text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Description (Optional)</label>
                <textarea
                  rows={3}
                  value={renameDescription}
                  onChange={(e) => setRenameDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#1A1E29] border border-[#2B3244] focus:border-purple-500 rounded-lg text-white focus:outline-none resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRenameOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* "Play All" Continuous Highlight Reel Player Modal */}
      {isPlayingAll && resolvedClips.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[#11141D] border border-[#232A3B] rounded-2xl shadow-2xl overflow-y-auto flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#1F2535] flex items-center justify-between bg-[#151924]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  SIMULATED REEL: {activePlaylist?.title}
                </span>
                <span className="text-[11px] font-mono text-purple-400 ml-2">
                  Clip {currentClipIndex + 1} of {resolvedClips.length}
                </span>
              </div>
              <button
                onClick={() => setIsPlayingAll(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#202738] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Visualizer Simulation Screen */}
            <div className="p-8 flex flex-col items-center justify-center bg-[#090B0F] border-b border-[#1F2535] space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
                <Volume2 className="w-8 h-8 animate-pulse" />
              </div>

              {/* Clip Metadata */}
              <div className="text-center space-y-1 max-w-lg">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${getTypeBadge(
                    resolvedClips[currentClipIndex].highlightType
                  )}`}
                >
                  {resolvedClips[currentClipIndex].highlightType}
                </span>
                <h4 className="text-sm font-semibold text-white pt-1">
                  {resolvedClips[currentClipIndex].meetingTitle}
                </h4>
                <p className="text-xs text-cyan-400 font-mono">
                  Timestamp: {resolvedClips[currentClipIndex].timestampFormatted}
                </p>
              </div>

              {/* Quote */}
              <blockquote className="text-center text-slate-200 text-sm italic max-w-lg px-4 leading-relaxed">
                &ldquo;{resolvedClips[currentClipIndex].highlightText}&rdquo;
              </blockquote>

              <p className="text-xs text-slate-400" role="status">Scenario preview · {reelElapsed}s / {clipDuration}s · {reelPaused ? "Paused" : "Playing"} · no audio</p>
              {/* Audio Waveform simulation bars */}
              <div className="flex items-center gap-1 h-8 pt-2">
                {[40, 70, 95, 60, 85, 30, 75, 100, 80, 50, 65, 90, 45, 80, 55, 70, 85].map(
                  (height, i) => (
                    <span
                      key={i}
                      className="w-1.5 bg-gradient-to-t from-purple-600 to-cyan-400 rounded-full transition-all duration-300"
                      style={{ height: `${height}%` }}
                    />
                  )
                )}
              </div>
            </div>

            {/* Play All Controls Bar */}
            <div className="p-4 bg-[#141822] flex items-center justify-between">
              <button
                onClick={() => {
                  const clip = resolvedClips[currentClipIndex];
                  setIsPlayingAll(false);
                  onNavigateMeeting(clip.meetingId, clip.timestamp);
                }}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Jump to full recording</span>
              </button>

              <div className="flex items-center gap-2">
                <button aria-label={reelPaused ? "Play reel" : "Pause reel"} onClick={() => { if (reelElapsed >= clipDuration) { setCurrentClipIndex(0); setReelElapsed(0); } setReelPaused(!reelPaused); }} className="p-2 text-white">{reelPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}</button>
                <button
                  onClick={() => { setCurrentClipIndex(Math.max(0, currentClipIndex - 1)); setReelElapsed(0); }}
                  disabled={currentClipIndex === 0}
                  className="p-2 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded-lg hover:bg-[#1F2535] transition-colors"
                  title="Previous Clip"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={() => { setReelElapsed(0);
                    setCurrentClipIndex(
                      Math.min(resolvedClips.length - 1, currentClipIndex + 1)
                    );
                  }}
                  disabled={currentClipIndex === resolvedClips.length - 1}
                  className="p-2 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded-lg hover:bg-[#1F2535] transition-colors"
                  title="Next Clip"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
