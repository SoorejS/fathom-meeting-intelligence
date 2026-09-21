import { CustomHighlightType, WorkspaceSettings } from "../types/settings";

export const DEFAULT_HIGHLIGHT_TYPES: CustomHighlightType[] = [
  {
    id: "ht_highlight",
    name: "Highlight",
    color: "#00C2FF",
    bgColor: "bg-[#00c2ff]/15",
    borderColor: "border-[#00c2ff]/30",
    order: 0,
  },
  {
    id: "ht_positive",
    name: "Positive Reaction",
    color: "#10B981",
    bgColor: "bg-[#10b981]/15",
    borderColor: "border-[#10b981]/30",
    order: 1,
  },
  {
    id: "ht_review",
    name: "Needs Review",
    color: "#F59E0B",
    bgColor: "bg-[#f59e0b]/15",
    borderColor: "border-[#f59e0b]/30",
    order: 2,
  },
  {
    id: "ht_feedback",
    name: "Feedback",
    color: "#F97316",
    bgColor: "bg-[#f97316]/15",
    borderColor: "border-[#f97316]/30",
    order: 3,
  },
];

export function defaultSettings(): WorkspaceSettings {
  return {
    recording: {
      autoRecordMode: "external",
      consentPreference: "remember",
      botDisplayName: "Fathom Notetaker",
    },
    summaries: {
      defaultTemplate: "default",
      autoExtractActions: true,
    },
    highlights: {
      types: DEFAULT_HIGHLIGHT_TYPES,
    },
    sharing: {
      defaultVisibility: "team",
    },
  };
}

export function updateRecordingSettings(
  settings: WorkspaceSettings,
  patch: Partial<WorkspaceSettings["recording"]>
): WorkspaceSettings {
  return {
    ...settings,
    recording: {
      ...settings.recording,
      ...patch,
    },
  };
}

export function updateSummarySettings(
  settings: WorkspaceSettings,
  patch: Partial<WorkspaceSettings["summaries"]>
): WorkspaceSettings {
  return {
    ...settings,
    summaries: {
      ...settings.summaries,
      ...patch,
    },
  };
}

export function updateSharingSettings(
  settings: WorkspaceSettings,
  patch: Partial<WorkspaceSettings["sharing"]>
): WorkspaceSettings {
  return {
    ...settings,
    sharing: {
      ...settings.sharing,
      ...patch,
    },
  };
}

export function addHighlightType(
  settings: WorkspaceSettings,
  name: string,
  color: string = "#A855F7"
): WorkspaceSettings {
  const cleanName = name.trim();
  if (!cleanName) return settings;

  const newType: CustomHighlightType = {
    id: "ht_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6),
    name: cleanName,
    color,
    bgColor: "bg-purple-500/15",
    borderColor: "border-purple-500/30",
    order: settings.highlights.types.length,
  };

  return {
    ...settings,
    highlights: {
      types: [...settings.highlights.types, newType],
    },
  };
}

export function updateHighlightType(
  settings: WorkspaceSettings,
  id: string,
  name: string,
  color?: string
): WorkspaceSettings {
  const cleanName = name.trim();
  if (!cleanName) return settings;

  return {
    ...settings,
    highlights: {
      types: settings.highlights.types.map((t) =>
        t.id === id ? { ...t, name: cleanName, color: color || t.color } : t
      ),
    },
  };
}

export function reorderHighlightTypes(
  settings: WorkspaceSettings,
  id: string,
  direction: "up" | "down"
): WorkspaceSettings {
  const types = [...settings.highlights.types].sort((a, b) => a.order - b.order);
  const currentIndex = types.findIndex((t) => t.id === id);
  if (currentIndex === -1) return settings;

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= types.length) return settings;

  const temp = types[currentIndex];
  types[currentIndex] = types[targetIndex];
  types[targetIndex] = temp;

  const reindexed = types.map((t, idx) => ({ ...t, order: idx }));

  return {
    ...settings,
    highlights: {
      types: reindexed,
    },
  };
}

export function deleteHighlightType(
  settings: WorkspaceSettings,
  id: string
): WorkspaceSettings {
  // Prevent deleting if 1 or fewer highlight types remain
  if (settings.highlights.types.length <= 1) return settings;

  const filtered = settings.highlights.types.filter((t) => t.id !== id);
  const reindexed = filtered.map((t, idx) => ({ ...t, order: idx }));

  return {
    ...settings,
    highlights: {
      types: reindexed,
    },
  };
}
