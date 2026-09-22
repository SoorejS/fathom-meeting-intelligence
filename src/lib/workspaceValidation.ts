import type { Playlist, PlaylistItem } from "../types/playlist";
import type { Tracker } from "../types/tracker";
import type { WorkspaceSettings, CustomHighlightType } from "../types/settings";
import { defaultSettings } from "../services/settingsService";

export const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown): value is string => typeof value === "string";
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(text);
const unique = <T extends { id: string }>(items: T[]): T[] => items.filter((item, i) => items.findIndex(other => other.id === item.id) === i);
const choice = <T extends string>(value: unknown, options: readonly T[], fallback: T): T =>
  options.includes(value as T) ? value as T : fallback;

export function readPlaylists(value: unknown, fallback: Playlist[]): Playlist[] {
  if (!Array.isArray(value)) return fallback;
  return unique(value.flatMap(item => {
    const p = record(item);
    if (!text(p.id) || !p.id || !text(p.title) || !text(p.createdAt) || !text(p.updatedAt)) return [];
    const items = Array.isArray(p.items) ? unique(p.items.filter((item): item is PlaylistItem => {
      const clip = record(item);
      return text(clip.id) && text(clip.meetingId) && text(clip.highlightId) && finite(clip.order) && text(clip.addedAt);
    })) : [];
    return [{ id: p.id, title: p.title, description: text(p.description) ? p.description : undefined, createdAt: p.createdAt, updatedAt: p.updatedAt, items }];
  }));
}

export function readTrackers(value: unknown, fallback: Tracker[]): Tracker[] {
  if (!Array.isArray(value)) return fallback;
  return unique(value.flatMap(item => {
    const t = record(item);
    if (!text(t.id) || !t.id || !text(t.name) || !strings(t.keywords) || typeof t.enabled !== "boolean" || !text(t.createdAt) || !text(t.updatedAt)) return [];
    if (t.meetingScope !== "all" && !strings(t.meetingScope)) return [];
    return [{ id: t.id, name: t.name, keywords: t.keywords.filter(k => k.trim()), enabled: t.enabled, meetingScope: t.meetingScope, createdAt: t.createdAt, updatedAt: t.updatedAt }];
  }));
}

export function readSettings(value: unknown): WorkspaceSettings {
  const defaults = defaultSettings();
  const s = record(value), r = record(s.recording), summary = record(s.summaries), h = record(s.highlights), sharing = record(s.sharing);
  const types = Array.isArray(h.types) ? unique(h.types.filter((item): item is CustomHighlightType => {
    const t = record(item);
    return text(t.id) && text(t.name) && text(t.color) && text(t.bgColor) && text(t.borderColor) && finite(t.order);
  })) : defaults.highlights.types;
  return {
    recording: {
      autoRecordMode: choice(r.autoRecordMode, ["all", "external", "internal", "manual"], defaults.recording.autoRecordMode),
      consentPreference: choice(r.consentPreference, ["required", "remember", "disabled"], defaults.recording.consentPreference),
      botDisplayName: text(r.botDisplayName) ? r.botDisplayName : defaults.recording.botDisplayName,
    },
    summaries: {
      defaultTemplate: choice(summary.defaultTemplate, ["default", "executive", "sales", "engineering"], defaults.summaries.defaultTemplate),
      autoExtractActions: typeof summary.autoExtractActions === "boolean" ? summary.autoExtractActions : defaults.summaries.autoExtractActions,
    },
    highlights: { types },
    sharing: { defaultVisibility: choice(sharing.defaultVisibility, ["private", "team", "public"], defaults.sharing.defaultVisibility) },
  };
}
