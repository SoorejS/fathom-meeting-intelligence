import { Participant } from "./meeting";

export type MeetingProvider = "zoom" | "google_meet" | "teams";

export interface UpcomingMeeting {
  id: string;
  title: string;
  provider: MeetingProvider;
  startTime: string;
  startTimeFormatted: string;
  durationMinutes: number;
  participants: Participant[];
  notetakerEnabled: boolean;
  joinUrl: string;
}
