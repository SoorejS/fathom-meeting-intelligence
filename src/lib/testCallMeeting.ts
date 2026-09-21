import type { Meeting, TestCallDescriptor, SummarySection } from "../types/meeting";

export const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
export const TEST_PARTICIPANTS = [
  { id: "test_soorej", name: "Soorej", role: "Host", initials: "S", color: "bg-cyan-500" },
  { id: "test_alex", name: "Alex Morgan", role: "Scenario participant · simulated", initials: "AM", color: "bg-purple-500" },
];
// These cues appear on the call clock. Only cues reached before Stop are included.
// They are scenario notes, never presented as a transcription of microphone audio.
export const TEST_CUES = [
  { at: 0, speaker: 0, text: "Let's review release readiness and agree on the API migration follow-ups." },
  { at: 5, speaker: 1, text: "We decided to run a small beta before the public release. The beta will start next Tuesday.", decision: "Run a small beta next Tuesday before the public release." },
  { at: 10, speaker: 0, text: "I'll own the API migration checklist and send it to the team tomorrow.", action: "Send the API migration checklist to the team", due: "Tomorrow" },
  { at: 15, speaker: 1, text: "My concern is recording permissions. We need to verify the decline and microphone-denied flows before launch." },
  { at: 20, speaker: 1, text: "I'll verify the recording permission flows and document the results by Friday.", action: "Verify recording permission flows and document results", due: "Friday" },
  { at: 25, speaker: 0, text: "Agreed. The checklist and permission checks are our beta readiness criteria.", decision: "Use the checklist and permission checks as beta readiness criteria." },
];

export function isTestCall(value: unknown): value is TestCallDescriptor {
  if (!value || typeof value !== "object") return false;
  const d = value as TestCallDescriptor;
  return d.version === 1 && typeof d.id === "string" && /^test_[a-z0-9-]{8,64}$/.test(d.id) &&
    typeof d.title === "string" && d.title.trim().length > 0 && d.title.length <= 120 &&
    typeof d.date === "string" && Number.isFinite(Date.parse(d.date)) &&
    Number.isFinite(d.duration) && d.duration >= 0 && d.duration <= 300 &&
    ["microphone", "simulated"].includes(d.captureMode) && typeof d.hasLocalAudio === "boolean";
}

export function createTestMeeting(d: TestCallDescriptor): Meeting {
  const cues = TEST_CUES.filter(cue => cue.at <= d.duration);
  const transcript = cues.map((cue, index) => {
    const person = TEST_PARTICIPANTS[cue.speaker];
    return { id: `${d.id}_t${index}`, meetingId: d.id, speaker: person.name, speakerRole: person.role,
      speakerInitials: person.initials, speakerColor: person.color, timestamp: cue.at,
      timestampFormatted: formatTime(cue.at), text: cue.text };
  });
  const actions = cues.filter(c => c.action).map((cue, index) => ({
    id: `${d.id}_a${index}`, meetingId: d.id, text: cue.action!, owner: TEST_PARTICIPANTS[cue.speaker].name,
    status: "open" as const, dueDate: cue.due, sourceTimestamp: cue.at, sourceTimestampFormatted: formatTime(cue.at),
  }));
  const base: SummarySection = {
    title: "Test call summary",
    overview: "Scenario-generated release readiness notes. These describe the test script, not speech recognized from your microphone.",
    keyPoints: cues.map(c => c.text), decisions: cues.filter(c => c.decision).map(c => c.decision!),
    nextSteps: actions.map(a => `${a.owner}: ${a.text} (${a.dueDate})`),
  };
  return {
    id: d.id, title: d.title, date: d.date,
    dateFormatted: new Date(d.date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC",
    duration: d.duration, durationFormatted: formatTime(d.duration), category: "Product",
    thumbnail: "/test-call.svg", participants: TEST_PARTICIPANTS, transcript, actionItems: actions,
    highlights: cues.filter(c => c.decision || c.at === 15).map((cue, index) => ({
      id: `${d.id}_h${index}`, meetingId: d.id, timestamp: cue.at, timestampFormatted: formatTime(cue.at),
      text: cue.text, type: cue.at === 15 ? "Needs Review" : "Highlight", creator: "Fathom Notetaker",
    })),
    summary: {
      default: base,
      executive: { ...base, title: "Executive Brief", keyPoints: base.decisions.length ? base.decisions : ["The call ended before the decision cue. No decision was recorded."] },
      sales: { ...base, title: "Beta & Customer Readiness", keyPoints: cues.filter(c => /beta|release/.test(c.text)).map(c => c.text) },
      engineering: { ...base, title: "Engineering Follow-ups", keyPoints: cues.filter(c => /API|permission/.test(c.text)).map(c => c.text) },
    }, aiQnA: [], testCall: d,
  };
}

export function testCallFragment(d: TestCallDescriptor): string {
  // Share only the deterministic scenario metadata. Never put local audio in a URL.
  return new URLSearchParams({ call: JSON.stringify({ ...d, hasLocalAudio: false }) }).toString();
}
export function readTestCallFragment(hash: string): TestCallDescriptor | null {
  if (hash.length > 4000) return null;
  try {
    const value = JSON.parse(new URLSearchParams(hash.replace(/^#/, "")).get("call") || "null");
    return isTestCall(value) ? { ...value, hasLocalAudio: false } : null;
  } catch { return null; }
}
