"use client";
import React, { useState } from "react";
import { WorkspaceSettings } from "@/types/settings";
import { SummaryTemplateKey } from "@/types/meeting";
import { Video, Sparkles, Highlighter, Link, Check, Edit2, Trash2, ChevronUp, ChevronDown, Shield, Bot, ArrowLeft, Plug } from "lucide-react";

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


function SettingCard({ icon, title, description, children }: {icon: React.ReactNode; title: string; description?: string; children?: React.ReactNode}) {
 return <div className="setting-card"><div className="text-neutral-100 shrink-0 mt-1">{icon}</div><div className="flex-1 min-w-0"><h3 className="text-lg font-semibold text-white">{title}</h3>{description && <p className="text-sm text-neutral-400 leading-snug mt-1">{description}</p>}{children}</div></div>;
}
export const SettingsModal: React.FC<SettingsModalProps> = ({isOpen,onClose,settings,onUpdateRecording,onUpdateSummaries,onUpdateSharing,onAddHighlightType,onUpdateHighlightType,onReorderHighlightTypes,onDeleteHighlightType}) => {
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


return <div className="settings-page" aria-label="Settings">
 <div className="max-w-[900px] mx-auto w-full">
  <div className="flex items-center justify-between mb-8"><button onClick={onClose} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white"><ArrowLeft size={16}/>Back to workspace</button><span role="status" className="text-xs text-neutral-400">{savedToast ? "Saved on this device" : "Changes save automatically"}</span></div>
  <h1 className="sr-only">Settings</h1>
  <div className="flex flex-wrap items-center justify-center gap-4 mb-12 text-base text-white"><label htmlFor="auto-record">Auto-record</label><select id="auto-record" value={settings.recording.autoRecordMode} onChange={e => {onUpdateRecording({autoRecordMode:e.target.value as WorkspaceSettings["recording"]["autoRecordMode"]});notifySaved();}} className="settings-select"><option value="all">All meetings</option><option value="external">External meetings</option><option value="internal">Internal meetings</option><option value="manual">No meetings. I&apos;ll record manually</option></select><span className="text-sm text-neutral-400">Saved calendar preference</span></div>
  <section className="settings-section" id="recording"><h2>VIDEO CONFERENCING</h2>
   <p className="text-sm text-neutral-400 mb-4">External meeting capture is simulated. Start a browser Test Call to try the recording workflow.</p>
   {["Zoom", "Google Meet", "Microsoft Teams"].map((name,index) => <SettingCard key={name} icon={<span className={"provider-icon provider-"+index}><Video size={24}/></span>} title={name} description="Not connected · browser Test Call available"/>)}
  </section>
  <section className="settings-section" id="summaries"><h2>MEETING PREFERENCES</h2>
   <SettingCard icon={<Bot size={27}/>} title="Bot Name" description="Saved for a future conferencing integration. Test calls retain their labeled demo identity."><div className="flex gap-2 mt-4"><input aria-label="Bot display name" value={settings.recording.botDisplayName} onChange={e => onUpdateRecording({botDisplayName:e.target.value})} className="settings-select min-w-0 flex-1"/><button onClick={notifySaved} className="settings-button">Update</button></div></SettingCard>
   <SettingCard icon={<Sparkles size={27}/>} title="Auto-Generate Action Items" description="Saved preference for future capture. Demo action items are prepared from the scenario notes."><label className="flex items-center justify-between gap-3 mt-4 text-sm text-neutral-300">Automatic action-item extraction<button role="switch" aria-label="Automatic action-item extraction" aria-checked={settings.summaries.autoExtractActions} onClick={() => {onUpdateSummaries({autoExtractActions:!settings.summaries.autoExtractActions});notifySaved();}} className={"settings-switch " + (settings.summaries.autoExtractActions ? "enabled" : "")}><span>{settings.summaries.autoExtractActions && <Check size={12}/>}</span></button></label></SettingCard>
   <SettingCard icon={<Sparkles size={27}/>} title="Default Meeting Summary Template" description="The initial template for meetings without an individual template preference."><select aria-label="Default Meeting Summary Template" value={settings.summaries.defaultTemplate} onChange={e => {onUpdateSummaries({defaultTemplate:e.target.value as SummaryTemplateKey});notifySaved();}} className="settings-select mt-4"><option value="default">Enhanced</option><option value="executive">Executive Brief</option><option value="sales">Sales &amp; Deals</option><option value="engineering">Engineering Spec</option></select></SettingCard>
   <SettingCard icon={<Shield size={27}/>} title="Recording Consent" description="Every browser test call requires explicit approval before capture."><select aria-label="Recording consent preference" value={settings.recording.consentPreference} onChange={e => {onUpdateRecording({consentPreference:e.target.value as WorkspaceSettings["recording"]["consentPreference"]});notifySaved();}} className="settings-select mt-4"><option value="remember">Remember preference</option><option value="required">Require explicit consent on every call</option><option value="disabled" disabled>Legacy preference — consent still required</option></select></SettingCard>
   <SettingCard icon={<Link size={27}/>} title="Default Share Link Access" description="Saved workspace preference. Public demo links can be viewed by anyone with the link; team/private enforcement requires authentication."><select aria-label="Default meeting visibility" value={settings.sharing.defaultVisibility} onChange={e => {onUpdateSharing({defaultVisibility:e.target.value as WorkspaceSettings["sharing"]["defaultVisibility"]});notifySaved();}} className="settings-select mt-4"><option value="public">Anyone with the link can view</option><option value="team">Team workspace</option><option value="private">Private to me</option></select></SettingCard>
  </section>
  <section className="settings-section"><h2>INTEGRATIONS</h2><p className="text-sm text-neutral-400 mb-4">Integration previews only. No accounts are connected and no meeting data is sent.</p>{[{name:"Claude",description:"Ask anything about your meetings"},{name:"ChatGPT",description:"Ask anything about your meetings"},{name:"Zapier",description:"Automate sending meeting content to your apps"},{name:"Slack",description:"Send meeting highlights to your team"},{name:"Salesforce",description:"Sync summaries and highlights to contacts and opportunities"},{name:"HubSpot",description:"Keep customer conversations with your CRM records"},{name:"Task Manager",description:"Send action items to your preferred task manager"}].map(integration => <div key={integration.name} className="setting-card items-center"><Plug size={25} className="text-neutral-400 shrink-0"/><div className="flex-1 min-w-0"><h3 className="text-lg font-semibold">{integration.name}</h3><p className="text-sm text-neutral-400">{integration.description}</p></div><span className="text-xs text-neutral-400 shrink-0">Not connected</span></div>)}</section>
  <section className="settings-section" id="highlights"><h2 className="flex items-center gap-2"><Highlighter size={18}/>HIGHLIGHT OPTIONS</h2><p className="text-sm text-neutral-400 mb-4">Configure the labels and colors available when highlighting a transcript.</p><div className="settings-highlights">              {/* Highlights List */}
              <div className="space-y-2">
                {settings.highlights.types.map((type, idx) => (
                  <div
                    key={type.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#252527] border border-[#343436] text-xs"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                      <span
                        className="w-5 h-5 rounded shrink-0"
                        style={{ backgroundColor: type.color }}
                      />
                      {editingId === type.id ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text" maxLength={80}
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
                            className="px-2 py-0.5 bg-[#303033] border border-cyan-500 rounded text-xs text-white focus:outline-none w-full max-w-[200px]"
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
                            className="p-1 text-cyan-400 hover:text-white rounded hover:bg-[#303033]"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-semibold uppercase truncate" style={{color: type.color}}>{type.name}</span>
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
                          className="p-1 text-slate-400 hover:text-cyan-400 rounded hover:bg-[#303033]"
                          title="Rename Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {/* Move Up */}
                      <button
                        onClick={() => onReorderHighlightTypes(type.id, "up")}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-[#303033]"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      {/* Move Down */}
                      <button
                        onClick={() => onReorderHighlightTypes(type.id, "down")}
                        disabled={idx === settings.highlights.types.length - 1}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-[#303033]"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => onDeleteHighlightType(type.id)}
                        disabled={settings.highlights.types.length <= 1}
                        className="p-1 text-slate-400 hover:text-rose-400 disabled:opacity-30 rounded hover:bg-[#303033]"
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
                className="p-3 rounded-xl bg-[#252527] border border-[#343436] space-y-3"
              >
                <span className="text-xs font-semibold text-white">Add New Category</span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text" maxLength={80}
                    required
                    placeholder="e.g. Risk or Key Decision"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-[#303033] border border-[#343436] focus:border-cyan-500 rounded-lg text-white text-xs focus:outline-none"
                  />
                  {/* Preset Colors */}
                  <div className="flex items-center gap-1.5 px-2">
                    {presetColors.map((col) => (
                      <button
                        key={col}
                        aria-label={"Category color " + col}
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
              </form></div></section>
  <div className="flex justify-end pb-8"><button onClick={onClose} className="settings-button">Done</button></div>
 </div>
</div>;
};
