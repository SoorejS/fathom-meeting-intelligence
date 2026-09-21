"use client";

import React, { useState, useMemo } from "react";
import { Meeting } from "@/types/meeting";
import { Play, Calendar, Clock, CheckSquare, Sparkles, Share2, Search, ArrowUpRight, MessageSquare } from "lucide-react";

interface MeetingsDashboardProps {
  meetings: Meeting[];
  onSelectMeeting: (meetingId: string) => void;
  onShareMeeting: (meeting: Meeting) => void;
}

export const MeetingsDashboard: React.FC<MeetingsDashboardProps> = ({
  meetings,
  onSelectMeeting,
  onShareMeeting,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "duration">("newest");

  const categories = ["All", "Product", "Client", "Engineering", "Sales", "Hiring", "Customer"];

  const filteredMeetings = useMemo(() => {
    return meetings
      .filter((m) => {
        if (selectedCategory !== "All" && m.category !== selectedCategory) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = m.title.toLowerCase().includes(q);
          const matchesParticipant = m.participants.some((p) => p.name.toLowerCase().includes(q));
          const matchesSummary = m.summary.default.overview.toLowerCase().includes(q);
          if (!matchesTitle && !matchesParticipant && !matchesSummary) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "duration") {
          return b.duration - a.duration;
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [meetings, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#090B0F] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner / Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E2431]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">My Calls</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {meetings.length} recordings
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            AI-generated summaries, action items, and transcripts synchronized automatically.
          </p>
        </div>

        {/* Dashboard filter & sort controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter calls..."
              className="pl-8 pr-3 py-1.5 bg-[#121620] border border-[#232B39] rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/40 w-40 sm:w-48"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "duration")}
            className="bg-[#121620] border border-[#232B39] text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500/40"
          >
            <option value="newest">Newest first</option>
            <option value="duration">Longest first</option>
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => {
          const count =
            cat === "All"
              ? meetings.length
              : meetings.filter((m) => m.category === cat).length;
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/35 shadow-sm shadow-cyan-950/20"
                  : "bg-[#121620] hover:bg-[#181E2C] text-slate-400 hover:text-slate-200 border border-[#202736]"
              }`}
            >
              <span>{cat}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-cyan-400/20 text-cyan-200" : "bg-[#1A202D] text-slate-400"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Meetings Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredMeetings.map((meeting, index) => {
          const isLatest = index === 0 && selectedCategory === "All" && !searchQuery;
          return (
            <div
              key={meeting.id}
              className={`group bg-[#11151F] hover:bg-[#151A26] border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col justify-between hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-950/10 cursor-pointer relative ${
                isLatest ? "border-cyan-500/30 ring-1 ring-cyan-500/20" : "border-[#1F2635]"
              }`}
              onClick={() => onSelectMeeting(meeting.id)}
            >
              {/* Card Top: Thumbnail with Play Overlay */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                <img
                  src={meeting.thumbnail}
                  alt={meeting.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#11151F] via-transparent to-black/40" />

                {/* Duration Badge */}
                <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-mono text-slate-200 flex items-center gap-1 border border-white/10">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>{meeting.durationFormatted}</span>
                </div>

                {/* Category Badge */}
                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-black/70 backdrop-blur-md text-cyan-300 border border-cyan-500/30">
                    {meeting.category}
                  </span>
                </div>

                {isLatest && (
                  <div className="absolute top-2.5 right-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-cyan-500 text-black shadow-lg shadow-cyan-500/40 animate-pulse">
                      Latest Call
                    </span>
                  </div>
                )}

                {/* Play Button Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="w-12 h-12 rounded-full bg-cyan-500 text-black flex items-center justify-center shadow-xl shadow-cyan-500/40 transform group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{meeting.dateFormatted}</span>
                  </div>
                  <h2 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                    {meeting.title}
                  </h2>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {meeting.summary.default.overview}
                  </p>
                </div>

                {/* Intelligence Chips (Action Items, Highlights, Transcripts) */}
                <div className="pt-2 border-t border-[#1C2331] space-y-3">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                      <CheckSquare className="w-3 h-3" />
                      <span>{meeting.actionItems.length} Actions</span>
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium">
                      <Sparkles className="w-3 h-3" />
                      <span>{meeting.highlights.length} Highlights</span>
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1A212E] text-slate-400 font-medium">
                      <MessageSquare className="w-3 h-3" />
                      <span>{meeting.transcript.length} turns</span>
                    </span>
                  </div>

                  {/* Participants Avatars + Share button */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center -space-x-1.5">
                      {meeting.participants.map((p) => (
                        <div
                          key={p.id}
                          className={`w-6 h-6 rounded-full ${p.color} text-white flex items-center justify-center text-[9px] font-bold ring-2 ring-[#11151F]`}
                          title={`${p.name} • ${p.role}`}
                        >
                          {p.initials}
                        </div>
                      ))}
                      <span className="text-[11px] text-slate-400 pl-3">
                        {meeting.participants.length} speakers
                      </span>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onShareMeeting(meeting)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-[#1D2534] transition-colors"
                        title="Share Meeting Recording"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onSelectMeeting(meeting.id)}
                        className="p-1.5 rounded-lg text-slate-400 group-hover:text-cyan-400 hover:bg-[#1D2534] transition-colors"
                        title="Open Meeting Intelligence View"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
