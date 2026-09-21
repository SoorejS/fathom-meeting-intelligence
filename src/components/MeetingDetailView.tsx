"use client";

import React, { useState, useMemo } from "react";
import { Meeting, HighlightType, SummaryTemplateKey } from "@/types/meeting";
import { useLocalAudio } from "@/lib/useLocalAudio";
import { MeetingPlayer } from "./MeetingPlayer";
import { SummaryView } from "./SummaryView";
import { TranscriptView } from "./TranscriptView";
import { AskAiView } from "./AskAiView";
import {
  ArrowLeft,
  Share2,
  Sparkles,
  Calendar,
  Clock,
  Copy,
  Check,
  MoreHorizontal,
  Play,
  ThumbsUp,
  AlertCircle,
  MessageSquare,
} from "lucide-react";

interface MeetingDetailViewProps {
  meeting: Meeting;
  summaryTemplate: SummaryTemplateKey;
  onTemplateChange: (template: SummaryTemplateKey) => void;
  initialTimestamp?: number;
  onBack: () => void;
  onShare: (timestamp: number) => void;
  onUpdateMeeting: (updatedMeeting: Meeting) => void;
}

type MainTab = "summary" | "transcript" | "ask-ai";

export const MeetingDetailView: React.FC<MeetingDetailViewProps> = ({
  meeting, summaryTemplate, onTemplateChange,
  initialTimestamp = 0,
  onBack,
  onShare,
  onUpdateMeeting,
}) => {
  const audio = useLocalAudio(meeting.id, !!meeting.testCall?.hasLocalAudio);
  const [activeTab, setActiveTab] = useState<MainTab>("summary");
  const [currentTime, setCurrentTime] = useState<number>(initialTimestamp);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

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
    setCurrentTime(Math.max(0, Math.min(meeting.duration, seconds)));
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

  const handleAddHighlight = (timestamp: number, text: string, type: HighlightType) => {
    const newHighlight = {
      id: `hl_${crypto.randomUUID()}`,
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
      creatorColor: "bg-[#00c2ff]",
    };
    const updated = {
      ...meeting,
      highlights: [newHighlight, ...meeting.highlights],
    };
    onUpdateMeeting(updated);
  };

  const handleCopyTranscript = async () => {
    const txt = meeting.transcript
      .map((t) => `[${t.timestampFormatted}] ${t.speaker}: ${t.text}`)
      .join("\n");
    try { await navigator.clipboard.writeText(txt); setCopiedToast("Transcript copied to clipboard!"); }
    catch { setCopiedToast("Clipboard unavailable. Select and copy the transcript text."); }
    setTimeout(() => setCopiedToast(null), 2500);
  };

  const getHighlightBadge = (type: HighlightType) => {
    switch (type) {
      case "Positive Reaction":
        return {
          bg: "bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30",
          icon: <ThumbsUp className="w-3 h-3 text-[#10b981]" />,
        };
      case "Needs Review":
        return {
          bg: "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30",
          icon: <AlertCircle className="w-3 h-3 text-[#f59e0b]" />,
        };
      case "Feedback":
        return {
          bg: "bg-[#f97316]/15 text-[#f97316] border-[#f97316]/30",
          icon: <MessageSquare className="w-3 h-3 text-[#f97316]" />,
        };
      default:
        return {
          bg: "bg-[#00c2ff]/15 text-[#00c2ff] border-[#00c2ff]/30",
          icon: <Sparkles className="w-3 h-3 text-[#00c2ff]" />,
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0f14]">
      {/* Top Breadcrumb Bar */}
      <div className="h-11 border-b border-[#1c1f26] bg-[#111216] px-6 flex items-center justify-between shrink-0 select-none">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white px-2 py-1 rounded-md hover:bg-[#1a1d24] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>My Calls</span>
        </button>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="hidden sm:inline font-medium text-slate-300">{meeting.title}</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {meeting.category}
          </span>
        </div>
      </div>

      {/* Main Two-Column Layout (Matching Fathom Reference Screenshot) */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 min-h-0 max-w-[1600px] mx-auto w-full">
        {/* LEFT COLUMN: Player + Tab Strip + Intelligence Workspace (~58% on Desktop) */}
        <div className="min-w-0 lg:col-span-7 flex flex-col space-y-4">
          {/* 1. Video Player */}
          {meeting.testCall && <div className="text-xs text-slate-400 rounded-lg border border-slate-700 p-3"><strong className="text-cyan-300">Test call · Scenario-generated notes</strong><p>Transcript and intelligence follow the test script, not recognized speech. {audio.url ? "Playback uses your locally saved microphone audio." : meeting.testCall.hasLocalAudio && !audio.unavailable ? "Loading local audio…" : "Playback is simulated; no local audio is available."}</p></div>}
          <MeetingPlayer
            audioUrl={audio.url}            duration={meeting.duration}
            currentTime={currentTime}
            onTimeUpdate={handleSeek}
            highlights={meeting.highlights}
            currentSpeaker={currentSpeaker}
            allSpeakers={meeting.participants}
            meetingTitle={meeting.title}
          />

          {/* 2. Horizontal Tab Strip (SUMMARY | TRANSCRIPT | ASK FATHOM) */}
          <div className="border-b border-[#1f222a] flex flex-wrap gap-2 items-center justify-between pt-1 select-none">
            <div className="flex items-center gap-3 sm:gap-6 text-xs font-bold tracking-wider">
              {(
                [
                  { id: "summary", label: "SUMMARY" },
                  { id: "transcript", label: "TRANSCRIPT" },
                  { id: "ask-ai", label: "ASK FATHOM" },
                ] as const
              ).map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 relative transition-colors cursor-pointer ${
                      isActive ? "text-[#00c2ff]" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00c2ff]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Copy Action on Right of Tab Strip */}
            {activeTab === "transcript" && (
              <button
                onClick={handleCopyTranscript}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#15232d] hover:bg-[#1b2d3a] border border-[#00c2ff]/30 text-[#00c2ff] rounded-lg text-xs font-medium transition-colors cursor-pointer"
                title="Copy Transcript"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Transcript</span>
              </button>
            )}
          </div>

          {/* 3. Tab Content Area Scrolling Beneath Video */}
          <div className="min-h-[420px] flex-1">
            {activeTab === "summary" && (
              <SummaryView summaryTemplates={meeting.summary} activeTemplate={summaryTemplate} setActiveTemplate={onTemplateChange} />
            )}

            {activeTab === "transcript" && (
              <TranscriptView
                transcript={meeting.transcript}
                currentTime={currentTime}
                onSeek={handleSeek}
                onAddHighlight={handleAddHighlight}
              />
            )}

            {activeTab === "ask-ai" && (
              <AskAiView
                meeting={meeting}
                onSeek={handleSeek}
              />
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Title, Date, Share, Action Items & Highlights (~42% on Desktop) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          {/* Meeting Title & Date Header */}
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
              {meeting.title}
            </h1>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{meeting.dateFormatted}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{meeting.durationFormatted}</span>
              </div>
            </div>
          </div>

          {/* Share Button (Fathom Teal Pill + Adjacent Menu) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onShare(currentTime)}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[#0e3b43] hover:bg-[#134d58] border border-[#00c2ff]/30 text-[#00c2ff] hover:text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            <button
              onClick={() => onShare(currentTime)}
              className="p-2 rounded-xl bg-[#161820] hover:bg-[#1f222b] border border-[#262934] text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* ACTION ITEMS Card (Matching Screenshot) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                ACTION ITEMS
              </h3>
              <span className="text-[11px] text-slate-400">
                {meeting.actionItems.filter((a) => a.status === "completed").length}/
                {meeting.actionItems.length} completed
              </span>
            </div>

            <div className="bg-[#14161d] border border-[#222530] rounded-xl p-3.5 space-y-3">
              {meeting.actionItems.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">
                  No action items were identified in this meeting.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {meeting.actionItems.map((item) => {
                    const isCompleted = item.status === "completed";
                    return (
                      <div
                        key={item.id}
                        className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors ${
                          isCompleted ? "opacity-60 bg-[#101217]" : "hover:bg-[#1a1d26]"
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => handleToggleActionItem(item.id)}
                          className="mt-0.5 cursor-pointer text-slate-400 hover:text-cyan-400 focus:outline-none"
                          title={isCompleted ? "Mark as open" : "Mark as completed"}
                        >
                          {isCompleted ? (
                            <div className="w-4 h-4 rounded bg-[#10b981] flex items-center justify-center text-black font-bold">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded border-2 border-slate-500 hover:border-[#00c2ff]" />
                          )}
                        </button>

                        {/* Task info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <p
                            className={`text-xs leading-snug transition-colors ${
                              isCompleted ? "line-through text-slate-400" : "text-slate-200"
                            }`}
                          >
                            {item.text}
                          </p>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="font-semibold text-slate-300">{item.owner}</span>
                            {item.dueDate && <span>• {item.dueDate}</span>}
                            <button
                              onClick={() => handleSeek(item.sourceTimestamp)}
                              className="font-mono text-[#00c2ff] hover:underline flex items-center gap-0.5 ml-auto"
                              title="Seek playback to discussion moment"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>{item.sourceTimestampFormatted}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* HIGHLIGHTS Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                HIGHLIGHTS ({meeting.highlights.length})
              </h3>
            </div>

            <div className="bg-[#14161d] border border-[#222530] rounded-xl p-3.5 space-y-2.5">
              {meeting.highlights.map((h) => {
                const style = getHighlightBadge(h.type);
                return (
                  <div
                    key={h.id}
                    onClick={() => handleSeek(h.timestamp)}
                    className="p-2.5 rounded-lg bg-[#181b24] hover:bg-[#1f222d] border border-[#242734] hover:border-cyan-500/30 cursor-pointer transition-all space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${style.bg}`}
                      >
                        {style.icon}
                        <span>{h.type}</span>
                      </span>

                      <span className="font-mono text-[#00c2ff] flex items-center gap-1 group-hover:underline">
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>{h.timestampFormatted}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 italic line-clamp-2">&ldquo;{h.text}&rdquo;</p>
                    {h.creator === "You" && <div className="flex gap-3 text-xs" onClick={event => event.stopPropagation()}>
                      <select aria-label={"Type of highlight at " + h.timestampFormatted} value={h.type} className="bg-[#181b24] text-slate-200 rounded" onChange={event => onUpdateMeeting({ ...meeting, highlights: meeting.highlights.map(item => item.id === h.id ? { ...item, type: event.target.value as HighlightType } : item) })}>
                        {["Highlight", "Positive Reaction", "Needs Review", "Feedback"].map(type => <option key={type}>{type}</option>)}
                      </select>
                      <button className="text-slate-400 hover:text-red-300" onClick={() => onUpdateMeeting({ ...meeting, highlights: meeting.highlights.filter(item => item.id !== h.id) })}>Remove highlight</button>
                    </div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Participants Card */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              PARTICIPANTS ({meeting.participants.length})
            </h3>
            <div className="bg-[#14161d] border border-[#222530] rounded-xl p-3 flex flex-wrap gap-2">
              {meeting.participants.map((p) => {
                const isSpeaking = currentSpeaker?.name === p.name;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all ${
                      isSpeaking
                        ? "bg-[#00c2ff]/10 border-[#00c2ff]/40 text-white"
                        : "bg-[#181b24] border-[#242734] text-slate-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full ${p.color} text-white flex items-center justify-center text-[8px] font-bold`}
                    >
                      {p.initials}
                    </div>
                    <span className="text-xs font-medium">{p.name}</span>
                    {isSpeaking && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00c2ff] animate-ping" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Copied Toast Notification */}
      {copiedToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#14161d] border border-[#00c2ff]/40 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-3.5 h-3.5 text-[#00c2ff]" />
          <span>{copiedToast}</span>
        </div>
      )}
    </div>
  );
};
