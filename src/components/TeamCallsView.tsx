"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Meeting } from "@/types/meeting";
import { MeetingVisibility } from "@/types/team";
import {
  TEAM_MEMBERS,
  getMeetingOwner,
  getDefaultMeetingVisibility,
  filterMeetingsByTeammate,
} from "@/services/teamService";
import {
  Users,
  Search,
  Lock,
  Globe,
  Share2,
  Play,
  Calendar,
  Clock,
  Sparkles,
  Check,
} from "lucide-react";

interface TeamCallsViewProps {
  meetings: Meeting[];
  visibilities: Record<string, MeetingVisibility>;
  onToggleVisibility: (meetingId: string) => void;
  onSelectMeeting: (meetingId: string) => void;
  onShareMeeting: (meeting: Meeting) => void;
}

export const TeamCallsView: React.FC<TeamCallsViewProps> = ({
  meetings,
  visibilities,
  onToggleVisibility,
  onSelectMeeting,
  onShareMeeting,
}) => {
  const [selectedTeammate, setSelectedTeammate] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Filter meetings by teammate and visibility
  const displayedMeetings = useMemo(() => {
    const teammateFiltered = filterMeetingsByTeammate(meetings, selectedTeammate, visibilities);

    if (!searchQuery.trim()) return teammateFiltered;

    const q = searchQuery.toLowerCase();
    return teammateFiltered.filter((m) => {
      const owner = getMeetingOwner(m.id);
      return (
        m.title.toLowerCase().includes(q) ||
        owner.name.toLowerCase().includes(q) ||
        m.participants.some((p) => p.name.toLowerCase().includes(q))
      );
    });
  }, [meetings, selectedTeammate, visibilities, searchQuery]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-[#090B0F]">
      {/* Header Banner */}
      <div className="pb-4 border-b border-[#1E2431] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <span>Team Calls</span>
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Fathom Pro Workspace
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Recorded calls shared across your engineering, product, and growth teammates.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search team calls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#1A1E29] border border-[#2B3244] focus:border-cyan-500 rounded-lg text-white placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Teammate Filter Pills */}
      <div className="space-y-2">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Filter by Teammate
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedTeammate("All")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              selectedTeammate === "All"
                ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shadow-sm"
                : "bg-[#141720] hover:bg-[#1A1E2A] text-slate-400 hover:text-slate-200 border border-[#222736]"
            }`}
          >
            <span>All Teammates</span>
            <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#1F2535] text-slate-300">
              {filterMeetingsByTeammate(meetings, "All", visibilities).length}
            </span>
          </button>

          {TEAM_MEMBERS.map((member) => {
            const isSelected = selectedTeammate === member.name;
            const memberCount = filterMeetingsByTeammate(meetings, member.name, visibilities).length;

            return (
              <button
                key={member.id}
                onClick={() => setSelectedTeammate(member.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shadow-sm"
                    : "bg-[#141720] hover:bg-[#1A1E2A] text-slate-400 hover:text-slate-200 border border-[#222736]"
                }`}
              >
                <span className={`w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center ${member.color}`}>
                  {member.initials}
                </span>
                <span>{member.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#1F2535] text-slate-300">
                  {memberCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Team Calls Grid */}
      <div className="space-y-4">
        {displayedMeetings.length === 0 ? (
          <div className="p-12 rounded-2xl border border-dashed border-[#242C3D] bg-[#0E121A] text-center max-w-lg mx-auto my-8 space-y-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">No team calls match this filter</h3>
            <p className="text-xs text-slate-400">
              Switch teammate filters or mark meetings as &quot;Team Visible&quot; to share them with your workspace.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {displayedMeetings.map((meeting) => {
              const owner = getMeetingOwner(meeting.id);
              const visibility = visibilities[meeting.id] || getDefaultMeetingVisibility(meeting.id);
              const isTeam = visibility === "team";

              return (
                <div
                  key={meeting.id}
                  className="group bg-[#15171e] hover:bg-[#1a1d26] border border-[#222530] hover:border-cyan-500/40 rounded-xl overflow-hidden transition-all duration-200 flex flex-col justify-between hover:shadow-xl cursor-pointer"
                  onClick={() => onSelectMeeting(meeting.id)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                    <Image
                      width={600}
                      height={338}
                      src={meeting.thumbnail}
                      alt={meeting.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-85 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#15171e] via-transparent to-black/30" />

                    {/* Duration Badge */}
                    <div className="absolute bottom-2.5 right-2.5 bg-black/85 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-mono text-slate-200 border border-white/10">
                      {meeting.durationFormatted}
                    </div>

                    {/* Visibility Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-md border ${
                          isTeam
                            ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/40"
                            : "bg-black/75 text-slate-400 border-slate-700"
                        }`}
                      >
                        {isTeam ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        <span>{isTeam ? "Team Visible" : "Personal"}</span>
                      </span>
                    </div>

                    {/* Category badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-black/75 backdrop-blur-md text-[#00c2ff] border border-[#00c2ff]/30">
                        {meeting.category}
                      </span>
                    </div>

                    {/* Play Hover Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="w-11 h-11 rounded-full bg-[#00c2ff] text-black flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <h2 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {meeting.title}
                      </h2>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{meeting.dateFormatted}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>{meeting.durationFormatted}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-cyan-400 text-[11px]" title={`${meeting.highlights.length} highlights`}>
                          <Sparkles className="w-3 h-3" />
                          <span>{meeting.highlights.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Owner & Visibility Controls */}
                    <div
                      className="pt-2 border-t border-[#1F232E] flex items-center justify-between text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Owner Info */}
                      <div className="flex items-center gap-1.5" title={`Owner: ${owner.name} (${owner.role})`}>
                        <div
                          className={`w-5 h-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center ${owner.color}`}
                        >
                          {owner.initials}
                        </div>
                        <span className="text-[11px] text-slate-300 font-medium truncate max-w-[120px]">
                          {owner.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Interactive Visibility Toggle Button */}
                        <button
                          onClick={() => {
                            onToggleVisibility(meeting.id);
                            showToast(`Visibility toggled: ${isTeam ? "Personal" : "Team Visible"}`);
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold border transition-colors cursor-pointer ${
                            isTeam
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-[#1C202C] text-slate-400 border-[#2B3244] hover:text-slate-200"
                          }`}
                          title="Click to toggle visibility"
                        >
                          {isTeam ? "Shared with Team" : "Make Team Visible"}
                        </button>

                        <button
                          onClick={() => onShareMeeting(meeting)}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#202738] transition-colors"
                          title="Share Recording"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
