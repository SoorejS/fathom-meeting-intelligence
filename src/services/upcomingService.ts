import { UpcomingMeeting } from "../types/upcoming";

export function toggleUpcomingNotetaker(
  meetings: UpcomingMeeting[],
  meetingId: string
): UpcomingMeeting[] {
  return meetings.map((m) =>
    m.id === meetingId ? { ...m, notetakerEnabled: !m.notetakerEnabled } : m
  );
}

export function formatProviderLabel(provider: UpcomingMeeting["provider"]): {
  label: string;
  color: string;
} {
  switch (provider) {
    case "zoom":
      return { label: "Zoom", color: "text-blue-400 bg-blue-500/10 border-blue-500/30" };
    case "google_meet":
      return { label: "Google Meet", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    case "teams":
      return { label: "Microsoft Teams", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" };
    default:
      return { label: "Web Conference", color: "text-slate-400 bg-slate-500/10 border-slate-500/30" };
  }
}
