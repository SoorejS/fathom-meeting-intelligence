import { Playlist } from "../types/playlist";
import { Tracker } from "../types/tracker";
import { WorkspaceSettings } from "../types/settings";
import { UpcomingMeeting } from "../types/upcoming";
import { MeetingVisibility } from "../types/team";
import { SEEDED_PLAYLISTS } from "../data/seededPlaylists";
import { SEEDED_TRACKERS } from "../data/seededTrackers";
import { SEEDED_UPCOMING_MEETINGS } from "../data/seededUpcoming";
import { defaultSettings } from "../services/settingsService";
import { record, readPlaylists, readTrackers, readSettings } from "./workspaceValidation";

export const TIER2_STORAGE_KEY = "fathom-tier2-state-v1";

export interface Tier2State {
  version: 1;
  playlists: Playlist[];
  trackers: Tracker[];
  settings: WorkspaceSettings;
  upcomingMeetings: UpcomingMeeting[];
  visibilities: Record<string, MeetingVisibility>;
}

export function defaultTier2State(): Tier2State {
  return {
    version: 1,
    playlists: SEEDED_PLAYLISTS,
    trackers: SEEDED_TRACKERS,
    settings: defaultSettings(),
    upcomingMeetings: SEEDED_UPCOMING_MEETINGS,
    visibilities: {},
  };
}

export function decodeTier2State(raw: string | null): Tier2State {
  const defaults = defaultTier2State();
  try {
    const value = record(JSON.parse(raw || "null"));
    if (value.version !== 1) return defaults;
    const visibilities: Tier2State["visibilities"] = {};
    for (const [id, visibility] of Object.entries(record(value.visibilities))) {
      if (visibility === "personal" || visibility === "team") visibilities[id] = visibility;
    }
    // Only the Notetaker toggle is editable; preserve authoritative meeting metadata.
    const savedUpcoming = Array.isArray(value.upcomingMeetings) ? value.upcomingMeetings.map(record) : [];
    return {
      version: 1,
      playlists: readPlaylists(value.playlists, defaults.playlists),
      trackers: readTrackers(value.trackers, defaults.trackers),
      settings: readSettings(value.settings),
      upcomingMeetings: defaults.upcomingMeetings.map(meeting => {
        const saved = savedUpcoming.find(item => item.id === meeting.id);
        return typeof saved?.notetakerEnabled === "boolean" ? { ...meeting, notetakerEnabled: saved.notetakerEnabled } : meeting;
      }),
      visibilities,
    };
  } catch { return defaults; }
}

let memoryState: Tier2State = defaultTier2State();
const serverSnapshot = defaultTier2State();
export const getTier2ServerSnapshot = () => serverSnapshot;
let cachedRaw: string | null | undefined;
let storageUnavailable = false;
export const isTier2StorageUnavailable = () => storageUnavailable;
const listeners = new Set<() => void>();

export function getTier2Snapshot(): Tier2State {
  if (typeof window === "undefined" || storageUnavailable) return memoryState;
  try {
    const raw = window.localStorage.getItem(TIER2_STORAGE_KEY);
    // React requires the same snapshot reference until the stored value changes.
    if (raw === cachedRaw) return memoryState;
    cachedRaw = raw;
    memoryState = decodeTier2State(raw);
  } catch {
    // Fallback safely to memory
  }
  return memoryState;
}

export function saveTier2State(nextState: Tier2State): void {
  memoryState = nextState;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(TIER2_STORAGE_KEY, JSON.stringify(nextState));
      cachedRaw = JSON.stringify(nextState);
      storageUnavailable = false;
    } catch {
      // Storage quota or disabled; memory fallback remains intact
      storageUnavailable = true;
    }
  }
  listeners.forEach((cb) => cb());
}

export function subscribeTier2(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === TIER2_STORAGE_KEY || e.key === null) {
      storageUnavailable = false;
      listeners.forEach((cb) => cb());
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}
