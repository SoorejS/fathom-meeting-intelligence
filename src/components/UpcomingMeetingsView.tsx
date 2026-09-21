"use client";

import React, { useState } from "react";
import { UpcomingMeeting } from "@/types/upcoming";
import { formatProviderLabel } from "@/services/upcomingService";
import {
  Calendar,
  Clock,
  Video,
  Radio,
  ExternalLink,
  Bot,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Play,
  Check,
  UserCheck,
} from "lucide-react";

interface UpcomingMeetingsViewProps {
  upcomingMeetings: UpcomingMeeting[];
  onToggleNotetaker: (id: string) => void;
  onStartTestCall: () => void;
}

export const UpcomingMeetingsView: React.FC<UpcomingMeetingsViewProps> = ({
  upcomingMeetings,
  onToggleNotetaker,
  onStartTestCall,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleJoinSimulation = (meeting: UpcomingMeeting) => {
    showToast(`Joining ${meeting.title} (${meeting.provider.toUpperCase()}) in browser simulation...`);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-[#090B0F]">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#121622] via-[#161B29] to-[#10131C] border border-[#202738] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>Calendar Sync Active</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Upcoming Calendar Meetings
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Fathom monitors your connected calendar and sends your AI Notetaker to record, transcribe, and generate actionable executive summaries automatically.
          </p>
        </div>

        {/* Quick Action: Launch Test Call */}
        <button
          onClick={onStartTestCall}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-900/30 transition-all cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch Notetaker Test</span>
        </button>
      </div>

      {/* Upcoming Meetings List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>Scheduled Calls ({upcomingMeetings.length})</span>
          </h2>
          <span className="text-[11px] text-slate-400">
            {upcomingMeetings.filter((m) => m.notetakerEnabled).length} Notetakers armed
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {upcomingMeetings.map((meeting) => {
            const providerInfo = formatProviderLabel(meeting.provider);

            return (
              <div
                key={meeting.id}
                className="p-5 rounded-2xl bg-[#12151D] border border-[#1E2330] hover:border-cyan-500/40 hover:bg-[#151924] transition-all space-y-4 group"
              >
                {/* Top Row: Provider, Title, Time, Notetaker Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Provider Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${providerInfo.color}`}
                      >
                        {providerInfo.label}
                      </span>

                      {/* Time */}
                      <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3" />
                        <span>{meeting.startTimeFormatted}</span>
                      </span>

                      {/* Duration */}
                      <span className="text-[11px] text-slate-400">
                        {meeting.durationMinutes} min
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {meeting.title}
                    </h3>
                  </div>

                  {/* Notetaker Arming Toggle */}
                  <div className="flex items-center gap-2.5 bg-[#171B26] border border-[#232A3B] px-3 py-2 rounded-xl shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Bot
                        className={`w-4 h-4 ${
                          meeting.notetakerEnabled ? "text-cyan-400" : "text-slate-500"
                        }`}
                      />
                      <span className="text-xs font-semibold text-white">Notetaker</span>
                    </div>

                    <button
                      onClick={() => onToggleNotetaker(meeting.id)}
                      className={`text-xs flex items-center transition-colors cursor-pointer ${
                        meeting.notetakerEnabled ? "text-cyan-400" : "text-slate-500"
                      }`}
                      title={meeting.notetakerEnabled ? "Notetaker ON" : "Notetaker OFF"}
                    >
                      {meeting.notetakerEnabled ? (
                        <ToggleRight className="w-6 h-6" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Attendees & Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#1D222F]">
                  {/* Attendees */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Attendees:</span>
                    <div className="flex items-center gap-1.5">
                      {meeting.participants.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-1 bg-[#181C26] border border-[#252C3D] px-2 py-1 rounded-lg text-[11px] text-slate-300"
                          title={`${p.name} (${p.role})`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${p.color || "bg-cyan-500"}`}
                          />
                          <span>{p.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleJoinSimulation(meeting)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-[#1B202D] hover:bg-[#23293A] border border-[#2A3348] rounded-lg transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Join Call</span>
                    </button>

                    <button
                      onClick={onStartTestCall}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-400 hover:text-white bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/40 rounded-lg transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Record with Notetaker</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#161B24] border border-cyan-500/40 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl shadow-cyan-950/40 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-3.5 h-3.5 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
