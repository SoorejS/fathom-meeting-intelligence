import { Playlist } from "../types/playlist";
import { SEEDED_PLAYLISTS } from "../data/seededPlaylists";

export const TIER2_STORAGE_KEY = "fathom-tier2-state-v1";

export interface Tier2State {
  version: 1;
  playlists: Playlist[];
}

export function defaultTier2State(): Tier2State {
  return {
    version: 1,
    playlists: SEEDED_PLAYLISTS,
  };
}

let memoryState: Tier2State = defaultTier2State();
const listeners = new Set<() => void>();

export function getTier2Snapshot(): Tier2State {
  if (typeof window === "undefined") return memoryState;
  try {
    const raw = window.localStorage.getItem(TIER2_STORAGE_KEY);
    if (!raw) return memoryState;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1 && Array.isArray(parsed.playlists)) {
      memoryState = parsed;
      return parsed;
    }
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
    } catch {
      // Storage quota or disabled; memory fallback remains intact
    }
  }
  listeners.forEach((cb) => cb());
}

export function subscribeTier2(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === TIER2_STORAGE_KEY) {
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
