"use client";

import React, { useState, useMemo } from "react";
import { Meeting, HighlightType } from "@/types/meeting";
import { MeetingPlayer } from "./MeetingPlayer";
import { SummaryView } from "./SummaryView";
import { TranscriptView } from "./TranscriptView";
import { ActionItemsView } from "./ActionItemsView";
import { HighlightsView } from "./HighlightsView";
import { AskAiView } from "./AskAiView";
import {
  ArrowLeft,
  Share2,
  FileText,
  MessageSquare,
  CheckSquare,
  Sparkles,
  Bot,
  Users,
  Calendar,
  Clock,
  Download,
  Copy,
  Check,
} from "lucide-react";

interface MeetingDetailViewProps {
  meeting: Meeting;
  initialTimestamp?: number;
  onBack: () => void;
  onShare: () => void;
  onUpdateMeeting: (updatedMeeting: Meeting) => void;
}

type IntelligenceTab = "summary" | "transcript" | "action-items" | "highlights" | "ask-ai";

export const MeetingDetailView: React.FC<MeetingDetailViewProps> = ({
  meeting,
  initialTimestamp = 0,
  onBack,
  onShare,
  onUpdateMeeting,
}) => {
  const [activeTab, setActiveTab] = useState<IntelligenceTab>("summary");
  const [currentTime, setCurrentTime] = useState<number>(initialTimestamp);
  const [copiedSummaryToast, setCopiedSummaryToast] = useState(false);

  // Active speaker calculated based on current playback time
  const currentSpeaker = useMemo(() => {
    for (let i = meeting.transcript.length - 1; i >= 0; i--) {
      if (currentTime >= meeting.transcript[i].timestamp) {
        const seg = meeting.transcript[i];
        return (
          meeting.participants.find((p) => p.name === seg.speaker) || {
            id: seg.id,
            name: seg.speaker,
            role: seg.speakerRole || "Speaker",
            initials: seg.speakerInitials || seg.speaker.slice(0, 2).toUpperCase(),
            color: seg.speakerColor || "bg-cyan-600",
          }
        );
      }
    }
    return meeting.participants[0];
  }, [meeting, currentTime]);

  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
  };

  const handleToggleActionItem = (id: string) => {
    const updated = {
      ...meeting,
      actionItems: meeting.actionItems.map((ai) =>
        ai.id === id
          ? { ...ai, status: ai.status === "open" ? ("completed" as const) : ("open" as const) }
          : ai
      ),
    };
    onUpdateMeeting(updated);
  };

  const handleAddActionItem = (text: string, owner: string, dueDate: string) => {
    const newItem = {
      id: `ai_${Date.now()}`,
      meetingId: meeting.id,
      text,
      owner,
      ownerInitials: owner.slice(0, 2).toUpperCase(),
      ownerColor: "bg-cyan-600",
      status: "open" as const,
      dueDate,
      sourceTimestamp: Math.floor(currentTime),
      sourceTimestampFormatted: `${Math.floor(currentTime / 60)
        .toString()
        .padStart(2, "0")}:${Math.floor(currentTime % 60)
        .toString()
        .padStart(2, "0")}`,
    };
    const updated = {
      ...meeting,
      actionItems: [newItem, ...meeting.actionItems],
    };
    onUpdateMeeting(updated);
  };

  const handleAddHighlight = (timestamp: number, text: string, type: HighlightType) => {
    const newHighlight = {
      id: `hl_${Date.now()}`,
      meetingId: meeting.id,
      timestamp,
      timestampFormatted: `${Math.floor(timestamp / 60)
        .toString()
        .padStart(2, "0")}:${Math.floor(timestamp % 60)
        .toString()
        .padStart(2, "0")}`,
      type,
      text,
      creator: "You",
      creatorColor: "bg-cyan-500",
    };
    const updated = {
      ...meeting,
      highlights: [newHighlight, ...meeting.highlights],
    };
    onUpdateMeeting(updated);
  };

  const handleQuickCopySummary = () => {
    const s = meeting.summary.default;
    const txt = `${meeting.title}\n\nOverview:\n${s.overview}\n\nDecisions:\n${s.decisions.join(
      "\n"
    )}\n\nNext Steps:\n${s.nextSteps.join("\n")}`;
    navigator.clipboard.writeText(txt);
    setCopiedSummaryToast(true);
    setTimeout(() => setCopiedSummaryToast(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#090B0F]">
      {/* Top Header & Breadcrumb Bar */}
      <div className="h-14 border-b border-[#1E2431] bg-[#0C0F15] px-4 sm:px-6 flex items-center justify-between shrink-0 select-none">
        {/* Left: Back button + Meeting Title + Badges */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white px-2 py-1.5 rounded-lg bg-[#141822] hover:bg-[#1C2230] border border-[#232938] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">My Calls</span>
          </button>

          <div className="h-4 w-[1px] bg-[#232938] hidden sm:block" />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md">
                {meeting.title}
              </h2>
              <span className="hidden md:inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                {meeting.category}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick actions (Share, Copy, Export) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={handleQuickCopySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141822] hover:bg-[#1C2230] border border-[#232938] text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Copy meeting summary text"
          >
            {copiedSummaryToast ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Copy Notes</span>
              </>
            )}
          </button>

          <button
            onClick={onShare}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all shadow-md shadow-cyan-950/40 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Two-Column Responsive Layout */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 min-h-0">
        {/* Left Column (Playback + Participants): 7 Cols on desktop */}
        <div className="lg:col-span-7 flex flex-col space-y-5">
          {/* Interactive Player */}
          <MeetingPlayer
            duration={meeting.duration}
            currentTime={currentTime}
            onTimeUpdate={handleSeek}
            highlights={meeting.highlights}
            currentSpeaker={currentSpeaker}
            allSpeakers={meeting.participants}
            meetingTitle={meeting.title}
          />

          {/* Meeting Metadata & Participants Card */}
          <div className="bg-[#11151F] border border-[#202736] rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2533]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Participants ({meeting.participants.length})
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{meeting.dateFormatted}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{meeting.durationFormatted}</span>
                </div>
              </div>
            </div>

            {/* Participants Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {meeting.participants.map((p) => {
                const isSpeaking = currentSpeaker?.name === p.name;
                return (
                  <div
                    key={p.id}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                      isSpeaking
                        ? "bg-cyan-500/10 border-cyan-500/40 shadow-sm"
                        : "bg-[#141924] border-[#222B3B]"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full ${p.color} text-white flex items-center justify-center text-xs font-bold shrink-0 ring-2 ${
                        isSpeaking ? "ring-cyan-400" : "ring-transparent"
                      }`}
                    >
                      {p.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-white truncate">{p.name}</p>
                        {isSpeaking && (
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {p.role} {p.company ? `• ${p.company}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (Intelligence Workspace): 5 Cols on desktop */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-[560px]">
          {/* Workspace Tabs Header */}
          <div className="flex items-center gap-1 p-1 bg-[#10141D] border border-[#202736] rounded-xl mb-3 shrink-0 overflow-x-auto select-none">
            {[
              { id: "summary", label: "Summary", icon: FileText },
              { id: "transcript", label: "Transcript", icon: MessageSquare },
              { id: "action-items", label: `Actions (${meeting.actionItems.length})`, icon: CheckSquare },
              { id: "highlights", label: `Clips (${meeting.highlights.length})`, icon: Sparkles },
              { id: "ask-ai", label: "Ask AI", icon: Bot },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as IntelligenceTab)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#161B26]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel */}
          <div className="flex-1 min-h-0">
            {activeTab === "summary" && (
              <SummaryView summaryTemplates={meeting.summary} />
            )}

            {activeTab === "transcript" && (
              <TranscriptView
                transcript={meeting.transcript}
                currentTime={currentTime}
                onSeek={handleSeek}
                onAddHighlight={handleAddHighlight}
              />
            )}

            {activeTab === "action-items" && (
              <ActionItemsView
                actionItems={meeting.actionItems}
                onToggleStatus={handleToggleActionItem}
                onSeek={handleSeek}
                onAddActionItem={handleAddActionItem}
              />
            )}

            {activeTab === "highlights" && (
              <HighlightsView
                highlights={meeting.highlights}
                onSeek={handleSeek}
              />
            )}

            {activeTab === "ask-ai" && (
              <AskAiView
                aiQnA={meeting.aiQnA}
                onSeek={handleSeek}
                meetingTitle={meeting.title}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
