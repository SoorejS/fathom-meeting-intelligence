export interface PlaylistItem {
  id: string;
  meetingId: string;
  highlightId: string;
  order: number;
  addedAt: string;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  items: PlaylistItem[];
}

export interface ResolvedClip {
  clipId: string;
  order: number;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  highlightId: string;
  highlightText: string;
  highlightType: string;
  timestamp: number;
  timestampFormatted: string;
  creator: string;
}
