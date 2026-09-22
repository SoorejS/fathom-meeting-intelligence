"use client";

import { useSyncExternalStore, useCallback } from "react";
import { Playlist } from "../types/playlist";
import { Tracker } from "../types/tracker";
import { WorkspaceSettings } from "../types/settings";
import {
  getTier2Snapshot,
  saveTier2State,
  subscribeTier2,
  getTier2ServerSnapshot,
  isTier2StorageUnavailable,
} from "./workspaceStorage";
import * as playlistService from "../services/playlistService";
import * as trackerService from "../services/trackerService";
import * as settingsService from "../services/settingsService";
import { MeetingVisibility } from "../types/team";
import { getDefaultMeetingVisibility } from "../services/teamService";

export function useWorkspaceStore() {
  const state = useSyncExternalStore(
    subscribeTier2,
    getTier2Snapshot,
    getTier2ServerSnapshot
  );

  const playlists = state.playlists;
  const trackers = state.trackers;
  const settings = state.settings;

  // --- Playlist Actions ---
  const handleCreatePlaylist = useCallback((title: string, description?: string): Playlist => {
    const created = playlistService.createPlaylist(title, description);
    const updated = [created, ...getTier2Snapshot().playlists];
    saveTier2State({ ...getTier2Snapshot(), playlists: updated });
    return created;
  }, []);

  const handleRenamePlaylist = useCallback((playlistId: string, title: string, description?: string) => {
    const current = getTier2Snapshot().playlists;
    const target = current.find((p) => p.id === playlistId);
    if (!target) return;
    const modified = playlistService.renamePlaylist(target, title, description);
    const updated = current.map((p) => (p.id === playlistId ? modified : p));
    saveTier2State({ ...getTier2Snapshot(), playlists: updated });
  }, []);

  const handleDeletePlaylist = useCallback((playlistId: string) => {
    const current = getTier2Snapshot().playlists;
    const updated = playlistService.deletePlaylist(current, playlistId);
    saveTier2State({ ...getTier2Snapshot(), playlists: updated });
  }, []);

  const handleAddHighlightToPlaylist = useCallback((playlistId: string, meetingId: string, highlightId: string) => {
    const current = getTier2Snapshot().playlists;
    const target = current.find((p) => p.id === playlistId);
    if (!target) return;
    const modified = playlistService.addHighlightToPlaylist(target, meetingId, highlightId);
    const updated = current.map((p) => (p.id === playlistId ? modified : p));
    saveTier2State({ ...getTier2Snapshot(), playlists: updated });
  }, []);

  const handleRemoveClip = useCallback((playlistId: string, clipId: string) => {
    const current = getTier2Snapshot().playlists;
    const target = current.find((p) => p.id === playlistId);
    if (!target) return;
    const modified = playlistService.removeClipFromPlaylist(target, clipId);
    const updated = current.map((p) => (p.id === playlistId ? modified : p));
    saveTier2State({ ...getTier2Snapshot(), playlists: updated });
  }, []);

  const handleReorderClips = useCallback((playlistId: string, clipId: string, direction: "up" | "down") => {
    const current = getTier2Snapshot().playlists;
    const target = current.find((p) => p.id === playlistId);
    if (!target) return;
    const modified = playlistService.reorderClips(target, clipId, direction);
    const updated = current.map((p) => (p.id === playlistId ? modified : p));
    saveTier2State({ ...getTier2Snapshot(), playlists: updated });
  }, []);

  // --- Tracker Actions ---
  const handleCreateTracker = useCallback((name: string, keywords: string[], meetingScope: "all" | string[] = "all"): Tracker => {
    const created = trackerService.createTracker(name, keywords, meetingScope);
    const current = getTier2Snapshot().trackers;
    saveTier2State({ ...getTier2Snapshot(), trackers: [created, ...current] });
    return created;
  }, []);

  const handleUpdateTracker = useCallback((trackerId: string, patch: Partial<Tracker>) => {
    const current = getTier2Snapshot().trackers;
    const target = current.find((t) => t.id === trackerId);
    if (!target) return;
    const modified = trackerService.updateTracker(target, patch);
    const updated = current.map((t) => (t.id === trackerId ? modified : t));
    saveTier2State({ ...getTier2Snapshot(), trackers: updated });
  }, []);

  const handleToggleTracker = useCallback((trackerId: string) => {
    const current = getTier2Snapshot().trackers;
    const target = current.find((t) => t.id === trackerId);
    if (!target) return;
    const modified = trackerService.toggleTrackerEnabled(target);
    const updated = current.map((t) => (t.id === trackerId ? modified : t));
    saveTier2State({ ...getTier2Snapshot(), trackers: updated });
  }, []);

  const handleDeleteTracker = useCallback((trackerId: string) => {
    const current = getTier2Snapshot().trackers;
    const updated = trackerService.deleteTracker(current, trackerId);
    saveTier2State({ ...getTier2Snapshot(), trackers: updated });
  }, []);

  // --- Settings Actions ---
  const handleUpdateRecording = useCallback((patch: Partial<WorkspaceSettings["recording"]>) => {
    const current = getTier2Snapshot().settings;
    const updated = settingsService.updateRecordingSettings(current, patch);
    saveTier2State({ ...getTier2Snapshot(), settings: updated });
  }, []);

  const handleUpdateSummaries = useCallback((patch: Partial<WorkspaceSettings["summaries"]>) => {
    const current = getTier2Snapshot().settings;
    const updated = settingsService.updateSummarySettings(current, patch);
    saveTier2State({ ...getTier2Snapshot(), settings: updated });
  }, []);

  const handleUpdateSharing = useCallback((patch: Partial<WorkspaceSettings["sharing"]>) => {
    const current = getTier2Snapshot().settings;
    const updated = settingsService.updateSharingSettings(current, patch);
    saveTier2State({ ...getTier2Snapshot(), settings: updated });
  }, []);

  const handleAddHighlightType = useCallback((name: string, color?: string) => {
    const current = getTier2Snapshot().settings;
    const updated = settingsService.addHighlightType(current, name, color);
    saveTier2State({ ...getTier2Snapshot(), settings: updated });
  }, []);

  const handleUpdateHighlightType = useCallback((id: string, name: string, color?: string) => {
    const current = getTier2Snapshot().settings;
    const updated = settingsService.updateHighlightType(current, id, name, color);
    saveTier2State({ ...getTier2Snapshot(), settings: updated });
  }, []);

  const handleReorderHighlightTypes = useCallback((id: string, direction: "up" | "down") => {
    const current = getTier2Snapshot().settings;
    const updated = settingsService.reorderHighlightTypes(current, id, direction);
    saveTier2State({ ...getTier2Snapshot(), settings: updated });
  }, []);

  const handleDeleteHighlightType = useCallback((id: string) => {
    const current = getTier2Snapshot().settings;
    const updated = settingsService.deleteHighlightType(current, id);
    saveTier2State({ ...getTier2Snapshot(), settings: updated });
  }, []);

  const upcomingMeetings = state.upcomingMeetings;

  const handleToggleUpcomingNotetaker = useCallback((meetingId: string) => {
    const current = getTier2Snapshot().upcomingMeetings;
    const updated = current.map((m) =>
      m.id === meetingId ? { ...m, notetakerEnabled: !m.notetakerEnabled } : m
    );
    saveTier2State({ ...getTier2Snapshot(), upcomingMeetings: updated });
  }, []);

  const visibilities = state.visibilities || {};

  const handleToggleMeetingVisibility = useCallback((meetingId: string) => {
    const current = getTier2Snapshot().visibilities || {};
    const existing = current[meetingId] || getDefaultMeetingVisibility(meetingId);
    const next: MeetingVisibility = existing === "team" ? "personal" : "team";
    saveTier2State({ ...getTier2Snapshot(), visibilities: { ...current, [meetingId]: next } });
  }, []);

  return {
    storageError: isTier2StorageUnavailable(),
    playlists,
    createPlaylist: handleCreatePlaylist,
    renamePlaylist: handleRenamePlaylist,
    deletePlaylist: handleDeletePlaylist,
    addHighlightToPlaylist: handleAddHighlightToPlaylist,
    removeClip: handleRemoveClip,
    reorderClips: handleReorderClips,

    trackers,
    createTracker: handleCreateTracker,
    updateTracker: handleUpdateTracker,
    toggleTracker: handleToggleTracker,
    deleteTracker: handleDeleteTracker,

    settings,
    updateRecording: handleUpdateRecording,
    updateSummaries: handleUpdateSummaries,
    updateSharing: handleUpdateSharing,
    addHighlightType: handleAddHighlightType,
    updateHighlightType: handleUpdateHighlightType,
    reorderHighlightTypes: handleReorderHighlightTypes,
    deleteHighlightType: handleDeleteHighlightType,

    upcomingMeetings,
    toggleUpcomingNotetaker: handleToggleUpcomingNotetaker,

    visibilities,
    toggleMeetingVisibility: handleToggleMeetingVisibility,
  };
}
