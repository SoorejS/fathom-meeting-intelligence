export interface Tracker {
  id: string;
  name: string;
  keywords: string[];
  enabled: boolean;
  meetingScope: "all" | string[];
  createdAt: string;
  updatedAt: string;
}

export interface TrackerMatch {
  trackerId: string;
  trackerName: string;
  keyword: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  speaker: string;
  speakerColor?: string;
  segmentId: string;
  timestamp: number;
  timestampFormatted: string;
  excerpt: string;
}
