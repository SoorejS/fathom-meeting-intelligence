import { Meeting } from "../types/meeting";
import { Playlist, PlaylistItem, ResolvedClip } from "../types/playlist";

export function resolvePlaylistClips(playlist: Playlist, meetings: Meeting[]): ResolvedClip[] {
  const sortedItems = [...playlist.items].sort((a, b) => a.order - b.order);
  const resolved: ResolvedClip[] = [];

  for (const item of sortedItems) {
    const meeting = meetings.find((m) => m.id === item.meetingId);
    if (!meeting) continue;

    const highlight = meeting.highlights.find((h) => h.id === item.highlightId);
    if (!highlight) continue;

    resolved.push({
      clipId: item.id,
      order: item.order,
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      meetingDate: meeting.dateFormatted,
      highlightId: highlight.id,
      highlightText: highlight.text,
      highlightType: highlight.type,
      timestamp: highlight.timestamp,
      timestampFormatted: highlight.timestampFormatted,
      creator: highlight.creator,
    });
  }

  return resolved;
}

export function createPlaylist(title: string, description = ""): Playlist {
  const now = new Date().toISOString();
  return {
    id: "pl_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6),
    title: title.trim() || "Untitled Playlist",
    description: description.trim(),
    createdAt: now,
    updatedAt: now,
    items: [],
  };
}

export function renamePlaylist(playlist: Playlist, newTitle: string, newDescription?: string): Playlist {
  return {
    ...playlist,
    title: newTitle.trim() || playlist.title,
    description: newDescription !== undefined ? newDescription.trim() : playlist.description,
    updatedAt: new Date().toISOString(),
  };
}

export function deletePlaylist(playlists: Playlist[], playlistId: string): Playlist[] {
  return playlists.filter((p) => p.id !== playlistId);
}

export function addHighlightToPlaylist(
  playlist: Playlist,
  meetingId: string,
  highlightId: string
): Playlist {
  // Prevent duplicate insertion of the exact same highlight in the same playlist
  if (playlist.items.some((item) => item.meetingId === meetingId && item.highlightId === highlightId)) {
    return playlist;
  }

  const newItem: PlaylistItem = {
    id: "clip_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6),
    meetingId,
    highlightId,
    order: playlist.items.length,
    addedAt: new Date().toISOString(),
  };

  return {
    ...playlist,
    updatedAt: new Date().toISOString(),
    items: [...playlist.items, newItem],
  };
}

export function removeClipFromPlaylist(playlist: Playlist, clipId: string): Playlist {
  const filtered = playlist.items.filter((item) => item.id !== clipId);
  const reindexed = filtered.map((item, index) => ({
    ...item,
    order: index,
  }));

  return {
    ...playlist,
    updatedAt: new Date().toISOString(),
    items: reindexed,
  };
}

export function reorderClips(
  playlist: Playlist,
  clipId: string,
  direction: "up" | "down"
): Playlist {
  const items = [...playlist.items].sort((a, b) => a.order - b.order);
  const currentIndex = items.findIndex((i) => i.id === clipId);
  if (currentIndex === -1) return playlist;

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= items.length) return playlist;

  // Swap
  const temp = items[currentIndex];
  items[currentIndex] = items[targetIndex];
  items[targetIndex] = temp;

  // Re-index
  const reindexed = items.map((item, index) => ({
    ...item,
    order: index,
  }));

  return {
    ...playlist,
    updatedAt: new Date().toISOString(),
    items: reindexed,
  };
}
