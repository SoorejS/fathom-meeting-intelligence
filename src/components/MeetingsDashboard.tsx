"use client";

import Image from "next/image";
import React, { useState, useMemo } from "react";
import { Meeting } from "@/types/meeting";
import { UpcomingMeeting } from "@/types/upcoming";
import {
  Play,
  Sparkles,
  Share2,
  Search,
  ArrowUp,
  PanelRightClose,
  PanelRightOpen,
  Calendar,
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

  const groups = useMemo(() => {
    if (sortBy === "duration") return [{ label: "By duration", meetings: filteredMeetings }];
    const grouped = new Map<string, Meeting[]>();
    for (const meeting of filteredMeetings) {
      const date = new Date(meeting.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
      grouped.set(date, [...(grouped.get(date) || []), meeting]);
    }
    return Array.from(grouped, ([label, meetings]) => ({ label, meetings }));
  }, [filteredMeetings, sortBy]);

  return <div className="calls-dashboard">
    <section className="calls-library" aria-label="My Calls">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="text-lg font-semibold text-white">My Calls <span className="text-sm font-normal text-neutral-500 ml-2">{filteredMeetings.length} recordings</span></h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative"><Search size={15} className="absolute left-3 top-2.5 text-neutral-500"/><input aria-label="Filter calls" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Filter calls..." className="call-filter pl-9 w-40"/></div>
          <select aria-label="Sort calls" value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="call-filter"><option value="newest">Newest first</option><option value="duration">Longest first</option></select>
          <button onClick={() => setIsAskAiOpen(!isAskAiOpen)} className="p-2 text-neutral-400 hover:text-cyan-400" aria-label={isAskAiOpen ? "Hide Ask Fathom" : "Open Ask Fathom"}>{isAskAiOpen ? <PanelRightClose size={19}/> : <PanelRightOpen size={19}/>}</button>
        </div>
      </div>
      {upcomingMeetings.length > 0 && activeSubTab === "my-calls" && selectedCategory === "All" && !searchQuery && <div className="upcoming-strip">
        <Calendar size={19} className="text-cyan-400 shrink-0"/>
        <div className="min-w-0 flex-1"><p className="text-xs text-neutral-400">Upcoming · {upcomingMeetings[0].startTimeFormatted}</p><p className="text-sm text-neutral-200 truncate">{upcomingMeetings[0].title}</p></div>
        <div className="flex items-center gap-3 flex-wrap">
          {onToggleUpcomingNotetaker && <button onClick={() => onToggleUpcomingNotetaker(upcomingMeetings[0].id)} aria-pressed={upcomingMeetings[0].notetakerEnabled} className="text-xs text-neutral-300 hover:text-cyan-400">Notetaker {upcomingMeetings[0].notetakerEnabled ? "on" : "off"}</button>}
          <button onClick={() => onNavigate("upcoming")} className="text-xs text-cyan-400 hover:underline">View calendar ({upcomingMeetings.length})</button>
        </div>
      </div>}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4" aria-label="Meeting categories">{categories.map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} aria-pressed={selectedCategory === cat} className={"category-filter " + (selectedCategory === cat ? "selected" : "")}>{cat}</button>)}</div>
      {filteredMeetings.length === 0 ? <div className="py-20 text-center space-y-3"><Search className="mx-auto text-neutral-500"/><h2 className="text-lg">No calls found</h2><p className="text-sm text-neutral-400">Try a different search or category.</p><button onClick={() => { setSelectedCategory("All"); setSearchQuery(""); }} className="text-cyan-400 text-sm">Clear filters</button>{onStartTestCall && <button onClick={onStartTestCall} className="block mx-auto text-sm text-cyan-400">Start Test Call</button>}</div> :
        <div className="space-y-8">{groups.map(group => <section key={group.label}><h2 className="text-base font-semibold text-neutral-200 mb-4">{group.label}</h2><div className="call-grid">{group.meetings.map(meeting => <article key={meeting.id} className="call-card group">
          <button onClick={() => onSelectMeeting(meeting.id)} className="block w-full text-left" aria-label={"Open " + meeting.title}>
            <div className="call-thumbnail"><Image width={600} height={338} src={meeting.thumbnail} alt="" className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"/><span className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 text-xs text-white">{Math.ceil(meeting.duration / 60)} mins</span><span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"><Play size={38} className="fill-white/80 text-white"/></span></div>
            <h3 className="text-[15px] font-semibold text-white mt-3 leading-snug line-clamp-2 group-hover:text-cyan-300">{meeting.title}</h3>
          </button>
          <div className="flex items-center gap-2 mt-2 text-xs text-neutral-400"><span className="truncate flex-1" title={meeting.participants.map(p => p.name).join(", ")}>{meeting.participants.slice(0, 2).map(p => p.name).join(", ")}{meeting.participants.length > 2 ? " +" + (meeting.participants.length - 2) : ""}</span><button aria-label={"Share " + meeting.title} onClick={() => onShareMeeting(meeting)} className="p-1 hover:text-cyan-400"><Share2 size={15}/></button></div>
        </article>)}</div></section>)}</div>}
    </section>
    {isAskAiOpen && <aside className="account-assistant" aria-label="Ask Fathom across My Calls">
      <div className="flex items-center justify-between text-sm text-neutral-300"><h2 className="flex items-center gap-2"><Sparkles size={17}/> ASK FATHOM</h2><button onClick={() => setIsAskAiOpen(false)} aria-label="Collapse Ask Fathom panel"><PanelRightClose size={17}/></button></div>
      <div className="bg-[#302b1b] text-[#ffca28] rounded-md p-3 mt-3 text-sm"><strong>Ask Fathom across your calls</strong><p className="mt-1 text-[#d5bd72] text-xs leading-relaxed">Explore your meeting notes, decisions, and open action items. Open a call for timestamp citations.</p></div>
      <div className="flex-1 overflow-y-auto mt-4 min-h-0">{isAiLoading && <p role="status" className="text-sm text-neutral-400">Reading your meeting notes…</p>}{askAiAnswer && <div className="text-sm leading-relaxed text-neutral-300 whitespace-pre-line">{askAiAnswer.split(" • ").join("\n\n")}</div>}</div>
      <div className="space-y-2 flex flex-col items-end pt-5">{suggestedQuestions.map(q => <button key={q} disabled={isAiLoading} onClick={() => handleAskAi(q)} className="rounded-md border border-[#303033] hover:bg-white/5 px-3 py-2 text-xs text-neutral-200 text-right">{q}</button>)}</div>
      <form onSubmit={e => {e.preventDefault();handleAskAi(askAiQuery);}} className="rounded-lg bg-[#222224] p-3 mt-5"><input aria-label="Ask across My Calls" value={askAiQuery} onChange={e => setAskAiQuery(e.target.value)} placeholder="Ask anything..." className="w-full bg-transparent text-sm outline-none text-white"/><div className="flex justify-between items-center mt-5"><span className="rounded bg-[#333335] px-3 py-1 text-xs text-neutral-300">My Calls</span><button aria-label="Submit question" disabled={!askAiQuery.trim() || isAiLoading} className="rounded-full bg-[#333335] p-2 text-neutral-300 disabled:opacity-40"><ArrowUp size={17}/></button></div></form>
    </aside>}
  </div>;
};
