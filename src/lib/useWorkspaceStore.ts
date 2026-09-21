"use client";

import { useSyncExternalStore, useCallback } from "react";
import { Playlist } from "../types/playlist";
import {
  getTier2Snapshot,
  saveTier2State,
  subscribeTier2,
  defaultTier2State,
} from "./workspaceStorage";
import * as playlistService from "../services/playlistService";

export function useWorkspaceStore() {
  const state = useSyncExternalStore(
    subscribeTier2,
    getTier2Snapshot,
    defaultTier2State
  );

  const playlists = state.playlists;

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

  return {
    playlists,
    createPlaylist: handleCreatePlaylist,
    renamePlaylist: handleRenamePlaylist,
    deletePlaylist: handleDeletePlaylist,
    addHighlightToPlaylist: handleAddHighlightToPlaylist,
    removeClip: handleRemoveClip,
    reorderClips: handleReorderClips,
  };
}
