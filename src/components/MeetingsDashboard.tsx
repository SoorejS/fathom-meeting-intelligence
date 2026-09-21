"use client";

import Image from "next/image";
import React, { useState, useMemo } from "react";
import { Meeting } from "@/types/meeting";
import { UpcomingMeeting } from "@/types/upcoming";
import {
  Play,
  CheckSquare,
  Sparkles,
  Share2,
  Search,
  ArrowUpRight,
  ChevronDown,
  ArrowUp,
  PanelRightClose,
  PanelRightOpen,
  Calendar,
  Clock,
} from "lucide-react";

interface MeetingsDashboardProps {
  meetings: Meeting[];
  onSelectMeeting: (meetingId: string) => void;
  onShareMeeting: (meeting: Meeting) => void;
  activeSubTab: string;
  onNavigate: (tab: string) => void;
  upcomingMeetings?: UpcomingMeeting[];
  onToggleUpcomingNotetaker?: (id: string) => void;
  onStartTestCall?: () => void;
}

export const MeetingsDashboard: React.FC<MeetingsDashboardProps> = ({
  meetings,
  onSelectMeeting,
  onShareMeeting,
  activeSubTab,
  onNavigate,
  upcomingMeetings = [],
  onToggleUpcomingNotetaker,
  onStartTestCall,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "duration">("newest");
  const [isAskAiOpen, setIsAskAiOpen] = useState(true);
  const [askAiQuery, setAskAiQuery] = useState("");
  const [askAiAnswer, setAskAiAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const categories = ["All", "Product", "Client", "Engineering", "Sales", "Hiring", "Customer"];

  const subNavTabs = [
    { id: "my-calls", label: "My Calls" },
    { id: "team-calls", label: "Team Calls" },
    { id: "playlists", label: "Playlists" },
    { id: "alerts", label: "Alerts" },
    { id: "deals", label: "Deals" },
  ];

  const suggestedQuestions = [
    "Show open action items",
    "Summarize these meetings",
    "What decisions were made?",
  ];

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

  const handleAskAi = (prompt: string) => {
    const q = prompt.trim();
    if (!q || isAiLoading) return;
    setAskAiQuery(q);
    setIsAiLoading(true);
    setAskAiAnswer(null);

    setTimeout(() => {
      const query = q.toLowerCase();
      if (query.includes("action")) {
        setAskAiAnswer(meetings.flatMap((m) => m.actionItems.filter((item) => item.status === "open").map((item) => item.owner + ": " + item.text + " (" + m.title + ")")).join(" • ") || "No open action items.");
      } else if (query.includes("summar")) {
        setAskAiAnswer(meetings.map((m) => m.title + ": " + m.summary.default.overview).join(" • "));
      } else if (query.includes("decision")) {
        setAskAiAnswer(meetings.map((m) => m.title + ": " + m.summary.default.decisions.join(" ")).join(" • "));
      } else {
        setAskAiAnswer("Choose an overview question below, or open a meeting for questions with transcript citations. This demo only answers from its seeded meeting notes.");
      }
      setIsAiLoading(false);
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0e1014]">
      {/* 1. Sub-navigation Bar (Matching Fathom Reference Screenshot) */}
      <div className="py-2 min-h-11 border-b border-[#1c1f26] bg-[#111216] px-3 sm:px-6 flex flex-wrap items-center justify-between gap-2 shrink-0 select-none">
        <div className="flex items-center gap-4 h-8 overflow-x-auto text-xs font-semibold">
          {subNavTabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`h-full flex items-center relative transition-colors cursor-pointer ${
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

        {/* Ask Fathom Toggle */}
        <button
          onClick={() => setIsAskAiOpen(!isAskAiOpen)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-[#1a1d24] transition-colors cursor-pointer"
          title={isAskAiOpen ? "Collapse Ask Fathom panel" : "Open Ask Fathom panel"}
        >
          {isAskAiOpen ? (
            <>
              <PanelRightClose className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px]">Hide Ask Fathom</span>
            </>
          ) : (
            <>
              <PanelRightOpen className="w-3.5 h-3.5 text-[#00c2ff]" />
              <span className="text-[11px] text-[#00c2ff]">Ask Fathom</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Main Body: Left Content + Right Ask Fathom Panel */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        {/* Left Area: Meetings Grid */}
        <div className="min-w-0 flex-1 lg:overflow-y-auto p-4 sm:p-8 space-y-6">
          {/* Section Header: "Today" */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Your meetings</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {filteredMeetings.length} meetings · Explore summaries, transcripts, and decisions
              </p>
            </div>

            {/* Filter and Sort Controls */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter calls..."
                  className="pl-8 pr-3 py-1.5 bg-[#16181f] border border-[#262934] rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/40 w-36 sm:w-44"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "duration")}
                className="bg-[#16181f] border border-[#262934] text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500/40 cursor-pointer"
              >
                <option value="newest">Newest first</option>
                <option value="duration">Longest first</option>
              </select>
            </div>
          </div>

          {/* Next Upcoming Call Orientation Hero Banner */}
          {upcomingMeetings.length > 0 && activeSubTab === "my-calls" && selectedCategory === "All" && !searchQuery && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#111928] via-[#141A28] to-[#12151F] border border-cyan-500/30 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      Next Up
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {upcomingMeetings[0].startTimeFormatted} ({upcomingMeetings[0].durationMinutes}m)
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-tight">{upcomingMeetings[0].title}</h3>
                  <p className="text-[11px] text-slate-400">
                    {upcomingMeetings[0].participants.length} participants · {upcomingMeetings[0].provider.toUpperCase()} Meeting
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {onToggleUpcomingNotetaker && (
                  <button
                    onClick={() => onToggleUpcomingNotetaker(upcomingMeetings[0].id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      upcomingMeetings[0].notetakerEnabled
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/20"
                        : "bg-[#181C26] text-slate-400 border-[#2A3142] hover:text-slate-200"
                    }`}
                    title="Toggle automatic Notetaker joining"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        upcomingMeetings[0].notetakerEnabled ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                      }`}
                    />
                    <span>Notetaker {upcomingMeetings[0].notetakerEnabled ? "ARMED" : "OFF"}</span>
                  </button>
                )}

                <button
                  onClick={() => onNavigate("upcoming")}
                  className="px-3 py-1.5 rounded-xl bg-[#1E2433] hover:bg-[#252E42] border border-[#2B354C] text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer"
                >
                  View Calendar ({upcomingMeetings.length})
                </button>
              </div>
            </div>
          )}

          {/* Category Filter Pills */}
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
                      ? "bg-[#00c2ff]/15 text-[#00c2ff] border border-[#00c2ff]/40 shadow-sm"
                      : "bg-[#16181f] hover:bg-[#1d2029] text-slate-400 hover:text-slate-200 border border-[#242733]"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? "bg-[#00c2ff]/25 text-[#00c2ff]" : "bg-[#20232d] text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Empty State when no meetings match */}
          {filteredMeetings.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-[#131620] border border-[#222838] rounded-2xl p-8">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">No meetings match your criteria</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try searching for another keyword or clearing the category filter to see all recorded meetings.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    setSearchQuery("");
                  }}
                  className="px-3.5 py-1.5 bg-[#1F2535] hover:bg-[#283145] text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer"
                >
                  Clear filters
                </button>
                {onStartTestCall && (
                  <button
                    onClick={onStartTestCall}
                    className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950 rounded-lg transition-colors cursor-pointer"
                  >
                    Record a test call
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Meetings Cards Grid with Recent vs Archive Grouping */
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span>Today &amp; Recent Calls</span>
                  <span className="font-normal text-[11px] text-slate-400">{Math.min(3, filteredMeetings.length)} calls</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredMeetings.slice(0, 3).map((meeting, index) => {
                    const isLatest = index === 0 && selectedCategory === "All" && !searchQuery;
                    return (
                      <div
                        key={meeting.id}
                        className={`group bg-[#15171e] hover:bg-[#1a1d26] border rounded-xl overflow-hidden transition-all duration-200 flex flex-col justify-between hover:border-cyan-500/40 hover:shadow-xl cursor-pointer relative ${
                          isLatest ? "border-cyan-500/30 ring-1 ring-cyan-500/20" : "border-[#222530]"
                        }`}
                        onClick={() => onSelectMeeting(meeting.id)}
                      >
                        {/* Thumbnail with duration badge overlay */}
                        <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                          <Image
                            width={600}
                            height={338}
                            src={meeting.thumbnail}
                            alt={meeting.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-85 group-hover:opacity-100"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#15171e] via-transparent to-black/30" />

                          {/* Fathom Duration Badge: Bottom Right */}
                          <div className="absolute bottom-2.5 right-2.5 bg-black/85 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-mono text-slate-200 border border-white/10">
                            <span>{meeting.durationFormatted}</span>
                          </div>

                          {/* Category badge */}
                          <div className="absolute top-2.5 left-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-black/75 backdrop-blur-md text-[#00c2ff] border border-[#00c2ff]/30">
                              {meeting.category}
                            </span>
                          </div>

                          {/* Play Button Icon Overlay */}
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
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {meeting.summary.default.overview}
                            </p>
                          </div>

                          {/* Metadata strip */}
                          <div className="pt-2 border-t border-[#1f222c] flex items-center justify-between text-xs text-slate-400">
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="flex items-center gap-1 text-amber-300" title={`${meeting.actionItems.length} action items`}>
                                <CheckSquare className="w-3 h-3" />
                                <span>{meeting.actionItems.length}</span>
                              </span>
                              <span className="flex items-center gap-1 text-cyan-300" title={`${meeting.highlights.length} highlights`}>
                                <Sparkles className="w-3 h-3" />
                                <span>{meeting.highlights.length}</span>
                              </span>
                              <span className="text-slate-400">
                                {meeting.participants.length} speakers
                              </span>
                            </div>

                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => onShareMeeting(meeting)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#20232d] transition-colors"
                                title="Share Recording"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onSelectMeeting(meeting.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-[#20232d] transition-colors"
                                title="Open Recording"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Earlier Calls */}
              {filteredMeetings.length > 3 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <span>Earlier Workspace Discussions</span>
                    <span className="font-normal text-[11px] text-slate-400">{filteredMeetings.length - 3} calls</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredMeetings.slice(3).map((meeting) => (
                      <div
                        key={meeting.id}
                        className="group bg-[#15171e] hover:bg-[#1a1d26] border border-[#222530] rounded-xl overflow-hidden transition-all duration-200 flex flex-col justify-between hover:border-cyan-500/40 hover:shadow-xl cursor-pointer relative"
                        onClick={() => onSelectMeeting(meeting.id)}
                      >
                        {/* Thumbnail with duration badge overlay */}
                        <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                          <Image
                            width={600}
                            height={338}
                            src={meeting.thumbnail}
                            alt={meeting.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-85 group-hover:opacity-100"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#15171e] via-transparent to-black/30" />

                          {/* Fathom Duration Badge */}
                          <div className="absolute bottom-2.5 right-2.5 bg-black/85 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-mono text-slate-200 border border-white/10">
                            <span>{meeting.durationFormatted}</span>
                          </div>

                          {/* Category badge */}
                          <div className="absolute top-2.5 left-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-black/75 backdrop-blur-md text-[#00c2ff] border border-[#00c2ff]/30">
                              {meeting.category}
                            </span>
                          </div>

                          {/* Play Button Icon Overlay */}
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
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                              {meeting.summary.default.overview}
                            </p>
                          </div>

                          {/* Metadata strip */}
                          <div className="pt-2 border-t border-[#1f222c] flex items-center justify-between text-xs text-slate-400">
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="flex items-center gap-1 text-amber-300" title={`${meeting.actionItems.length} action items`}>
                                <CheckSquare className="w-3 h-3" />
                                <span>{meeting.actionItems.length}</span>
                              </span>
                              <span className="flex items-center gap-1 text-cyan-300" title={`${meeting.highlights.length} highlights`}>
                                <Sparkles className="w-3 h-3" />
                                <span>{meeting.highlights.length}</span>
                              </span>
                              <span className="text-slate-400">
                                {meeting.participants.length} speakers
                              </span>
                            </div>

                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => onShareMeeting(meeting)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#20232d] transition-colors"
                                title="Share Recording"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onSelectMeeting(meeting.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-[#20232d] transition-colors"
                                title="Open Recording"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Area: ASK FATHOM Panel (Matching Screenshot a85ae19e-c030-4304-9fda-9fc01c753c8d.png) */}
        {isAskAiOpen && (
          <aside className="w-full lg:w-80 xl:w-96 border-l border-[#1c1f26] bg-[#111216] flex flex-col justify-between p-4 shrink-0 overflow-y-auto select-none animate-in slide-in-from-right-4 duration-150">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#1c1f26]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#00c2ff]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    ASK FATHOM
                  </span>
                </div>
                <button
                  onClick={() => setIsAskAiOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded"
                >
                  <PanelRightClose className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Promotional Gift Banner (Matching Screenshot) */}
              <div className="p-3 rounded-xl bg-[#1c1f26]/80 border border-[#2b2e38] text-xs space-y-1">
                <div className="flex items-start gap-2">
                  <span className="text-base">🎁</span>
                  <div>
                    <span className="font-bold text-amber-300">
                      Your meeting intelligence, in one place
                    </span>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                      Explore prepared meeting intelligence. Open a call for answers with transcript citations.
                    </p>
                  </div>
                </div>
              </div>

              {/* Answer Display if queried */}
              {isAiLoading && (
                <div className="p-3 rounded-xl bg-[#161820] border border-[#262934] text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00c2ff] animate-pulse" />
                  <span>Synthesizing intelligence across your calls...</span>
                </div>
              )}

              {askAiAnswer && (
                <div className="p-3.5 rounded-xl bg-[#161820] border border-[#262934] text-xs text-slate-200 space-y-2 animate-in fade-in duration-100">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#00c2ff] font-semibold">
                    <Sparkles className="w-3 h-3" />
                    <span>FATHOM INTELLIGENCE</span>
                  </div>
                  <p className="leading-relaxed">{askAiAnswer}</p>
                </div>
              )}
            </div>

            {/* Bottom Section: Prompt Chips & Input Card */}
            <div className="space-y-3 pt-4">
              {/* Stacked Prompt Suggestions (Matching Screenshot) */}
              <div className="space-y-1.5 flex flex-col items-end">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    disabled={isAiLoading}
                    onClick={() => handleAskAi(q)}
                    className="px-3 py-1.5 bg-[#181a22] hover:bg-[#222530] border border-[#272a37] text-[11px] text-slate-300 hover:text-white rounded-xl transition-colors text-right shadow-sm cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Chat Input Card */}
              <div className="p-2.5 bg-[#161820] border border-[#262934] rounded-xl space-y-2 focus-within:border-[#00c2ff]/50 transition-colors">
                <input
                  type="text"
                  value={askAiQuery}
                  onChange={(e) => setAskAiQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAskAi(askAiQuery);
                  }}
                  placeholder="Ask anything..."
                  className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none px-1"
                />

                <div className="flex items-center justify-between pt-1 border-t border-[#20232c]">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-[#1e2029] px-2 py-0.5 rounded-md border border-[#292c38]">
                    <span>My Calls</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>

                  <button
                    onClick={() => handleAskAi(askAiQuery)}
                    disabled={!askAiQuery.trim() || isAiLoading}
                    className="w-6 h-6 rounded-full bg-[#2a2d39] hover:bg-[#00c2ff] hover:text-black text-white flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer"
                    title="Submit"
                  >
                    <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
