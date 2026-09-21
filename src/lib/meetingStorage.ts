import type { Meeting, Highlight, SummaryTemplateKey } from "../types/meeting";

export const STORAGE_KEY = "fathom-workspace-v1";
export interface SavedState {
  version: 1;
  meetings: Record<string, { statuses: Record<string, "open" | "completed">; highlights: Highlight[] }>;
  templates: Record<string, SummaryTemplateKey>;
}
export const emptyState = (): SavedState => ({ version: 1, meetings: {}, templates: {} });
export function decodeState(raw: string | null, seeds: Meeting[]): SavedState {
  const result = emptyState();
  try {
    const value = JSON.parse(raw || "null");
    if (value?.version !== 1) return result;
    for (const m of seeds) {
      const saved = value.meetings?.[m.id];
      if (saved) {
        const statuses: Record<string, "open" | "completed"> = {};
        for (const a of m.actionItems) if (["open", "completed"].includes(saved.statuses?.[a.id])) statuses[a.id] = saved.statuses[a.id];
        const highlights = Array.isArray(saved.highlights) ? saved.highlights.filter((h: Highlight) =>
          h && typeof h.id === "string" && h.creator === "You" && h.meetingId === m.id &&
          typeof h.text === "string" && typeof h.timestampFormatted === "string" &&
          ["Highlight", "Positive Reaction", "Needs Review", "Feedback"].includes(h.type) &&
          m.transcript.some(t => t.timestamp === h.timestamp)) : [];
        result.meetings[m.id] = { statuses, highlights };
      }
      const template = value.templates?.[m.id];
      if (["default", "executive", "sales", "engineering"].includes(template)) result.templates[m.id] = template;
    }
  } catch { /* Damaged or outdated storage must never prevent opening a meeting. */ }
  return result;
}
export function applySavedState(seeds: Meeting[], state: SavedState): Meeting[] {
  return seeds.map(m => {
    const saved = state.meetings[m.id];
    return saved ? { ...m, actionItems: m.actionItems.map(a => ({ ...a, status: saved.statuses[a.id] || a.status })), highlights: [...saved.highlights, ...m.highlights] } : m;
  });
}
