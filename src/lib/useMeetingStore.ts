"use client";
import { useMemo, useSyncExternalStore } from "react";
import { SEEDED_MEETINGS } from "../data/seededMeetings";
import type { Meeting, SummaryTemplateKey } from "../types/meeting";
import { STORAGE_KEY, decodeState, applySavedState, emptyState } from "./meetingStorage";

let memory: string | null = null;
let storageError = false;
const listeners = new Set<() => void>();
function snapshot() {
  if (storageError) return memory;
  try { return window.localStorage.getItem(STORAGE_KEY); }
  catch { return memory; }
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => { listeners.delete(listener); window.removeEventListener("storage", listener); };
}
function save(state: ReturnType<typeof emptyState>) {
  memory = JSON.stringify(state);
  try { window.localStorage.setItem(STORAGE_KEY, memory); storageError = false; }
  catch { storageError = true; }
  listeners.forEach(listener => listener());
}
export function useMeetingStore() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  const state = useMemo(() => decodeState(raw, SEEDED_MEETINGS), [raw]);
  const meetings = useMemo(() => applySavedState(SEEDED_MEETINGS, state), [state]);
  return {
    meetings, templates: state.templates, storageError,
    updateMeeting(meeting: Meeting) {
      const latest = decodeState(snapshot(), SEEDED_MEETINGS);
      latest.meetings[meeting.id] = {
        statuses: Object.fromEntries(meeting.actionItems.map(a => [a.id, a.status])),
        highlights: meeting.highlights.filter(h => h.creator === "You"),
      };
      save(latest);
    },
    setTemplate(id: string, template: SummaryTemplateKey) {
      const latest = decodeState(snapshot(), SEEDED_MEETINGS);
      latest.templates[id] = template;
      save(latest);
    },
  };
}
