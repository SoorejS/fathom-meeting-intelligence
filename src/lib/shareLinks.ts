import type { Meeting } from "../types/meeting";
import { testCallFragment } from "./testCallMeeting";

export const PUBLIC_APP_URL = "https://fathom-meeting-intelligence.vercel.app";

export function readPlaybackTimestamp(value: string | null, duration: number): { seconds: number; invalid: boolean } {
  if (value === null) return { seconds: 0, invalid: false };
  const seconds = Number(value);
  const valid = /^\d+(?:\.\d+)?$/.test(value) && Number.isFinite(seconds) && seconds <= duration;
  return { seconds: valid ? Math.floor(seconds) : 0, invalid: !valid };
}

export function meetingShareUrl(meeting: Meeting, timestamp?: number): string {
  const url = new URL("/share/" + (meeting.testCall ? "test" : encodeURIComponent(meeting.id)), PUBLIC_APP_URL);
  if (timestamp !== undefined) url.searchParams.set("t", String(readPlaybackTimestamp(String(timestamp), meeting.duration).seconds));
  if (meeting.testCall) url.hash = testCallFragment(meeting.testCall);
  return url.toString();
}
