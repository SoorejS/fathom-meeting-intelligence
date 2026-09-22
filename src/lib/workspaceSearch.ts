import type { Meeting } from "../types/meeting";
import type { Playlist } from "../types/playlist";
import type { Tracker } from "../types/tracker";

export type SearchCategory =
  | "all"
  | "transcripts"
  | "action-items"
  | "summaries"
  | "meetings"
  | "highlights"
  | "playlists"
  | "trackers";

export interface SearchResult {
  type: "meeting" | "transcript" | "actionItem" | "summary" | "highlight" | "playlist" | "tracker";
  meetingId?: string;
  meetingTitle?: string;
  targetTab?: "playlists" | "alerts";
  entityId?: string;
  category?: string;
  dateFormatted?: string;
  title: string;
  snippet: string;
  timestamp?: number;
  timestampFormatted?: string;
  speaker?: string;
  owner?: string;
}

// Search the current workspace models; no independent or stale index.
export function searchWorkspace(query: string, meetings: Meeting[], playlists: Playlist[] = [], trackers: Tracker[] = []): SearchResult[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matches: SearchResult[] = [];

    meetings.forEach((m) => {
      // 1. Match Meeting Title & Participants
      const dateText = [m.date, m.dateFormatted, new Date(m.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })].join(" • ");
      const dateMatch = dateText.toLowerCase().includes(q);
      const participantMatch = m.participants.find((p) => p.name.toLowerCase().includes(q));
      if (m.title.toLowerCase().includes(q) || participantMatch || dateMatch) {
        matches.push({
          type: "meeting",
          meetingId: m.id,
          meetingTitle: m.title,
          category: m.category,
          dateFormatted: m.dateFormatted,
          title: m.title,
          snippet: participantMatch
            ? `Participant match: ${participantMatch.name} (${participantMatch.role})`
            : dateMatch ? `Meeting date: ${dateText}` : `${m.participants.length} participants • ${m.durationFormatted} duration`,
        });
      }

      // 2. Match Summaries (Overview & Key points)
      const overview = m.summary.default.overview;
      if (overview.toLowerCase().includes(q)) {
        matches.push({
          type: "summary",
          meetingId: m.id,
          meetingTitle: m.title,
          category: m.category,
          dateFormatted: m.dateFormatted,
          title: `Summary Overview`,
          snippet: overview,
        });
      }

      [...new Set(Object.values(m.summary).flatMap(s => [s.overview, ...s.keyPoints, ...s.decisions, ...s.nextSteps]))].filter(text => text !== overview).forEach((kp) => {
        if (kp.toLowerCase().includes(q)) {
          matches.push({
            type: "summary",
            meetingId: m.id,
            meetingTitle: m.title,
            category: m.category,
            dateFormatted: m.dateFormatted,
            title: `Key Discussion Point`,
            snippet: kp,
          });
        }
      });

      // 3. Match Action Items
      m.actionItems.forEach((ai) => {
        if (ai.text.toLowerCase().includes(q) || ai.owner.toLowerCase().includes(q)) {
          matches.push({
            type: "actionItem",
            meetingId: m.id,
            meetingTitle: m.title,
            category: m.category,
            dateFormatted: m.dateFormatted,
            title: `Action Item: ${ai.text}`,
            snippet: `Assigned to ${ai.owner} (${ai.status}) • at ${ai.sourceTimestampFormatted}`,
            timestamp: ai.sourceTimestamp,
            timestampFormatted: ai.sourceTimestampFormatted,
            owner: ai.owner,
          });
        }
      });

      m.highlights.forEach(h => {
        if ((h.text + " " + h.type + " " + h.creator).toLowerCase().includes(q)) matches.push({
          type: "highlight", meetingId: m.id, meetingTitle: m.title, category: m.category,
          dateFormatted: m.dateFormatted, title: h.type + " at " + h.timestampFormatted,
          snippet: h.text, timestamp: h.timestamp, timestampFormatted: h.timestampFormatted,
        });
      });
      // 4. Match Transcripts
      m.transcript.forEach((t) => {
        if (t.text.toLowerCase().includes(q) || t.speaker.toLowerCase().includes(q)) {
          matches.push({
            type: "transcript",
            meetingId: m.id,
            meetingTitle: m.title,
            category: m.category,
            dateFormatted: m.dateFormatted,
            title: `${t.speaker} at ${t.timestampFormatted}`,
            snippet: t.text,
            timestamp: t.timestamp,
            timestampFormatted: t.timestampFormatted,
          });
        }
      });
    });

    // 5. Match Playlists
    playlists.forEach((p) => {
      if (
        p.title.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      ) {
        matches.push({
          type: "playlist",
          targetTab: "playlists", entityId: p.id,
          category: "Playlists",
          dateFormatted: `${p.items.length} clips`,
          title: p.title,
          snippet: p.description
            ? `${p.description} • Contains ${p.items.length} curated highlights`
            : `Curated highlight reel with ${p.items.length} clips across your workspace`,
        });
      }
    });

    // 6. Match Keyword Trackers
    trackers.forEach((t) => {
      if (
        t.name.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.toLowerCase().includes(q))
      ) {
        matches.push({
          type: "tracker",
          targetTab: "alerts", entityId: t.id,
          category: "Trackers",
          dateFormatted: t.enabled ? "Active" : "Disabled",
          title: `Tracker: ${t.name}`,
          snippet: `Keywords: [${t.keywords.join(", ")}] • ${
            t.enabled ? "Actively scanning transcripts" : "Scanning paused"
          }`,
        });
      }
    });

    return matches;
}
