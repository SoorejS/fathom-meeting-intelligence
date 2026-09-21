"use client";

import React, { useState } from "react";
import { WorkspaceSettings } from "@/types/settings";
import { SummaryTemplateKey } from "@/types/meeting";
import {
  Settings as SettingsIcon,
  Video,
  FileText,
  Highlighter,
  Share2,
  X,
  Check,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Shield,
  Bot,
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: WorkspaceSettings;
  onUpdateRecording: (patch: Partial<WorkspaceSettings["recording"]>) => void;
  onUpdateSummaries: (patch: Partial<WorkspaceSettings["summaries"]>) => void;
  onUpdateSharing: (patch: Partial<WorkspaceSettings["sharing"]>) => void;
  onAddHighlightType: (name: string, color?: string) => void;
  onUpdateHighlightType: (id: string, name: string, color?: string) => void;
  onReorderHighlightTypes: (id: string, direction: "up" | "down") => void;
  onDeleteHighlightType: (id: string) => void;
}

type SettingsTab = "recording" | "summaries" | "highlights" | "sharing";

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateRecording,
  onUpdateSummaries,
  onUpdateSharing,
  onAddHighlightType,
  onUpdateHighlightType,
  onReorderHighlightTypes,
  onDeleteHighlightType,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("recording");
  const [savedToast, setSavedToast] = useState(false);

  // New highlight state
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeColor, setNewTypeColor] = useState("#A855F7");

  // Inline edit state for highlight types
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const notifySaved = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  if (!isOpen) return null;

  const handleAddTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    onAddHighlightType(newTypeName, newTypeColor);
    setNewTypeName("");
    notifySaved();
  };

  const presetColors = [
    "#00C2FF", // Cyan
    "#10B981", // Emerald
    "#F59E0B", // Amber
    "#F97316", // Orange
    "#EF4444", // Red
    "#A855F7", // Purple
    "#EC4899", // Pink
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#11141D] border border-[#23293A] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-[#1E2433] bg-[#141824] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">WORKSPACE SETTINGS</h2>
              <p className="text-[11px] text-slate-400">Configure recording, intelligence, and sharing preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#202738] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1E2433] bg-[#0E1119] px-4 sm:px-6 gap-2 overflow-x-auto text-xs">
          {[
            { id: "recording", label: "Recording", icon: Video },
            { id: "summaries", label: "Summaries", icon: FileText },
            { id: "highlights", label: "Highlights", icon: Highlighter },
            { id: "sharing", label: "Sharing", icon: Share2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`flex items-center gap-2 py-3 px-3 border-b-2 font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-cyan-400 text-cyan-400 font-semibold"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 1. RECORDING TAB */}
          {activeTab === "recording" && (
            <div className="space-y-5 text-xs">
              {/* Auto Record Mode */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white">Auto-Record Mode</label>
                <p className="text-[11px] text-slate-400">
                  Saved demo preference. Calendar auto-joining is not connected; test calls always require explicit approval.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {[
                    { id: "all", label: "All scheduled meetings", desc: "Join both internal and external calendar events" },
                    { id: "external", label: "External meetings only (Recommended)", desc: "Join calls with participants outside your domain" },
                    { id: "internal", label: "Internal team calls only", desc: "Record only teammates inside your workspace" },
                    { id: "manual", label: "Manual record only", desc: "Never join automatically; record on-demand" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        onUpdateRecording({ autoRecordMode: mode.id as WorkspaceSettings["recording"]["autoRecordMode"] });
                        notifySaved();
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        settings.recording.autoRecordMode === mode.id
                          ? "bg-[#16212E] border-cyan-500/50 text-white"
                          : "bg-[#131620] border-[#222838] text-slate-300 hover:bg-[#181C28]"
                      }`}
                    >
                      <div className="font-semibold text-xs text-white">{mode.label}</div>
                      <div className="text-[11px] text-slate-400 mt-1">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bot Display Name */}
              <div className="space-y-2 pt-2 border-t border-[#1E2433]">
                <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Bot Display Name</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Saved display-name preference for a future conferencing integration. The test-call identity remains Soorej&apos;s Fathom Notetaker.
                </p>
                <div className="flex gap-2 max-w-md">
                  <input
                    type="text"
                    value={settings.recording.botDisplayName}
                    onChange={(e) => onUpdateRecording({ botDisplayName: e.target.value })}
                    className="flex-1 px-3 py-2 bg-[#1A1E29] border border-[#2B3244] focus:border-cyan-500 rounded-lg text-white text-xs focus:outline-none"
                  />
                  <button
                    onClick={notifySaved}
                    className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg text-xs transition-colors"
                  >
                    Update
                  </button>
                </div>
              </div>

              {/* Consent Policy */}
              <div className="space-y-2 pt-2 border-t border-[#1E2433]">
                <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Recording Consent Policy</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Saved consent preference. Every browser test call still requires explicit approval before capture.
                </p>
                <select
                  value={settings.recording.consentPreference}
                  onChange={(e) => {
                    onUpdateRecording({ consentPreference: e.target.value as WorkspaceSettings["recording"]["consentPreference"] });
                    notifySaved();
                  }}
                  className="w-full max-w-md px-3 py-2 bg-[#1A1E29] border border-[#2B3244] focus:border-cyan-500 rounded-lg text-white text-xs focus:outline-none cursor-pointer"
                >
                  <option value="remember">Remember preference (Default)</option>
                  <option value="required">Require explicit consent on every call</option>
                  <option value="disabled" disabled>Legacy preference (explicit consent remains required)</option>
                </select>
              </div>
            </div>
          )}

          {/* 2. SUMMARIES TAB */}
          {activeTab === "summaries" && (
            <div className="space-y-5 text-xs">
              {/* Default Template */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white">Default Summary Template</label>
                <p className="text-[11px] text-slate-400">
                  Choose which structured template is displayed by default when opening recorded meetings.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {[
                    { id: "default", name: "Standard Meeting Intelligence", desc: "Overview, Key Takeaways, Decisions, and Next Steps" },
                    { id: "executive", name: "Executive Brief", desc: "High-level summary with strategic decisions for executive leadership" },
                    { id: "sales", name: "Sales & Customer Impact", desc: "Pain points, customer objections, and pipeline commitments" },
                    { id: "engineering", name: "Engineering & Architecture", desc: "Technical specifications, schema changes, and sprint tasks" },
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => {
                        onUpdateSummaries({ defaultTemplate: tpl.id as SummaryTemplateKey });
                        notifySaved();
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        settings.summaries.defaultTemplate === tpl.id
                          ? "bg-[#16212E] border-cyan-500/50 text-white"
                          : "bg-[#131620] border-[#222838] text-slate-300 hover:bg-[#181C28]"
                      }`}
                    >
                      <div className="font-semibold text-xs text-white">{tpl.name}</div>
                      <div className="text-[11px] text-slate-400 mt-1">{tpl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Item Extraction */}
              <div className="space-y-2 pt-3 border-t border-[#1E2433]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white">Automatic Action-Item Extraction</span>
                    <p className="text-[11px] text-slate-400">
                      Use AI speech recognition to detect promises, assignees, and deadlines.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.summaries.autoExtractActions}
                    onChange={(e) => {
                      onUpdateSummaries({ autoExtractActions: e.target.checked });
                      notifySaved();
                    }}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 bg-[#1A1E29] border-[#2B3244] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. HIGHLIGHTS TAB */}
          {activeTab === "highlights" && (
            <div className="space-y-5 text-xs">
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-white">Custom Highlight Categories</h3>
                <p className="text-[11px] text-slate-400">
                  Manage categories available when logging moments in transcripts. Reorder or customize labels.
                </p>
              </div>

              {/* Highlights List */}
              <div className="space-y-2">
                {settings.highlights.types.map((type, idx) => (
                  <div
                    key={type.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#131620] border border-[#222838] text-xs"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: type.color }}
                      />
                      {editingId === type.id ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && editingName.trim()) {
                                onUpdateHighlightType(type.id, editingName.trim(), type.color);
                                setEditingId(null);
                                notifySaved();
                              } else if (e.key === "Escape") {
                                setEditingId(null);
                              }
                            }}
                            className="px-2 py-0.5 bg-[#1A1E29] border border-cyan-500 rounded text-xs text-white focus:outline-none w-full max-w-[200px]"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              if (editingName.trim()) {
                                onUpdateHighlightType(type.id, editingName.trim(), type.color);
                                setEditingId(null);
                                notifySaved();
                              }
                            }}
                            className="p-1 text-cyan-400 hover:text-white rounded hover:bg-[#202738]"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-semibold text-white truncate">{type.name}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Edit */}
                      {editingId !== type.id && (
                        <button
                          onClick={() => {
                            setEditingId(type.id);
                            setEditingName(type.name);
                          }}
                          className="p-1 text-slate-400 hover:text-cyan-400 rounded hover:bg-[#202738]"
                          title="Rename Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {/* Move Up */}
                      <button
                        onClick={() => onReorderHighlightTypes(type.id, "up")}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-[#202738]"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      {/* Move Down */}
                      <button
                        onClick={() => onReorderHighlightTypes(type.id, "down")}
                        disabled={idx === settings.highlights.types.length - 1}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-[#202738]"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => onDeleteHighlightType(type.id)}
                        disabled={settings.highlights.types.length <= 1}
                        className="p-1 text-slate-400 hover:text-rose-400 disabled:opacity-30 rounded hover:bg-[#202738]"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Highlight Category Form */}
              <form
                onSubmit={handleAddTypeSubmit}
                className="p-3 rounded-xl bg-[#141824] border border-[#252C3D] space-y-3"
              >
                <span className="text-xs font-semibold text-white">Add New Category</span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Risk or Key Decision"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-[#1A1E29] border border-[#2B3244] focus:border-cyan-500 rounded-lg text-white text-xs focus:outline-none"
                  />
                  {/* Preset Colors */}
                  <div className="flex items-center gap-1.5 px-2">
                    {presetColors.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setNewTypeColor(col)}
                        className={`w-5 h-5 rounded-full transition-transform ${
                          newTypeColor === col ? "scale-125 ring-2 ring-white" : "opacity-70 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer shrink-0"
                  >
                    Add Type
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 4. SHARING TAB */}
          {activeTab === "sharing" && (
            <div className="space-y-5 text-xs">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white">Default Meeting Visibility</label>
                <p className="text-[11px] text-slate-400">
                  Control who in your organization has access to recordings by default.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {[
                    { id: "team", label: "Team Workspace (Default)", desc: "Visible to all teammates in Fathom Pro" },
                    { id: "private", label: "Private to Me", desc: "Only accessible by the call owner" },
                    { id: "public", label: "Anyone with Link", desc: "Anyone with the share URL can view" },
                  ].map((vis) => (
                    <button
                      key={vis.id}
                      onClick={() => {
                        onUpdateSharing({ defaultVisibility: vis.id as WorkspaceSettings["sharing"]["defaultVisibility"] });
                        notifySaved();
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        settings.sharing.defaultVisibility === vis.id
                          ? "bg-[#16212E] border-cyan-500/50 text-white"
                          : "bg-[#131620] border-[#222838] text-slate-300 hover:bg-[#181C28]"
                      }`}
                    >
                      <div className="font-semibold text-xs text-white">{vis.label}</div>
                      <div className="text-[11px] text-slate-400 mt-1">{vis.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E2433] bg-[#141824] flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {savedToast ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Settings saved to workspace</span>
              </span>
            ) : (
              <span>Changes apply automatically</span>
            )}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#202738] hover:bg-[#2A334A] text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
