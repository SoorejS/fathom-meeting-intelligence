import { Meeting } from "../types/meeting";
import { Tracker, TrackerMatch } from "../types/tracker";

export function createTracker(
  name: string,
  keywords: string[],
  meetingScope: "all" | string[] = "all"
): Tracker {
  const now = new Date().toISOString();
  const cleanKeywords = Array.from(
    new Set(
      keywords
        .map((k) => k.trim())
        .filter((k) => k.length > 0)
    )
  );

  return {
    id: "tr_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6),
    name: name.trim() || "Untitled Tracker",
    keywords: cleanKeywords.length > 0 ? cleanKeywords : ["alert"],
    enabled: true,
    meetingScope,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateTracker(tracker: Tracker, patch: Partial<Tracker>): Tracker {
  const nextKeywords = patch.keywords
    ? Array.from(
        new Set(
          patch.keywords
            .map((k) => k.trim())
            .filter((k) => k.length > 0)
        )
      )
    : tracker.keywords;

  return {
    ...tracker,
    ...patch,
    keywords: nextKeywords,
    updatedAt: new Date().toISOString(),
  };
}

export function toggleTrackerEnabled(tracker: Tracker): Tracker {
  return {
    ...tracker,
    enabled: !tracker.enabled,
    updatedAt: new Date().toISOString(),
  };
}

export function deleteTracker(trackers: Tracker[], trackerId: string): Tracker[] {
  return trackers.filter((t) => t.id !== trackerId);
}

export function scanTranscriptMatches(trackers: Tracker[], meetings: Meeting[]): TrackerMatch[] {
  const matches: TrackerMatch[] = [];
  const enabledTrackers = trackers.filter((t) => t.enabled && t.keywords.length > 0);

  for (const tracker of enabledTrackers) {
    // Filter meetings according to tracker scope
    const targetMeetings =
      tracker.meetingScope === "all"
        ? meetings
        : meetings.filter((m) => tracker.meetingScope.includes(m.id));

    for (const meeting of targetMeetings) {
      for (const segment of meeting.transcript) {
        const lowerText = segment.text.toLowerCase();

        for (const keyword of tracker.keywords) {
          const lowerKw = keyword.toLowerCase();
          if (lowerKw && lowerText.includes(lowerKw)) {
            matches.push({
              trackerId: tracker.id,
              trackerName: tracker.name,
              keyword,
              meetingId: meeting.id,
              meetingTitle: meeting.title,
              meetingDate: meeting.dateFormatted,
              speaker: segment.speaker,
              speakerColor: segment.speakerColor,
              segmentId: segment.id,
              timestamp: segment.timestamp,
              timestampFormatted: segment.timestampFormatted,
              excerpt: segment.text,
            });
            // Avoid adding multiple identical matches for the same keyword in the same segment
            break;
          }
        }
      }
    }
  }

  // Sort matches by timestamp
  return matches.sort((a, b) => b.timestamp - a.timestamp);
}
