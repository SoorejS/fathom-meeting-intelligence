"use client";

import React, { useState, useSyncExternalStore } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { MeetingsDashboard } from "@/components/MeetingsDashboard";
import { MeetingDetailView } from "@/components/MeetingDetailView";
import { GlobalSearchModal } from "@/components/GlobalSearchModal";
import { ShareModal } from "@/components/ShareModal";
import { SEEDED_MEETINGS } from "@/data/seededMeetings";
import { Meeting } from "@/types/meeting";
import { Users, ListMusic } from "lucide-react";

function subscribeToUrl(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}
function navigate(meetingId?: string, timestamp?: number) {
  const url = new URL(window.location.href);
  url.search = "";
  if (meetingId) url.searchParams.set("meeting", meetingId);
  if (timestamp !== undefined) url.searchParams.set("t", String(timestamp));
  window.history.pushState({}, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
export default function Home() {
  const [meetings, setMeetings] = useState<Meeting[]>(SEEDED_MEETINGS);
  const search = useSyncExternalStore(subscribeToUrl, () => window.location.search, () => "");
  const params = new URLSearchParams(search);
  const selectedMeetingId = params.get("meeting");
  const rawTime = Number(params.get("t") || 0);
  const selectedMeetingTimestamp = Number.isFinite(rawTime) ? Math.max(0, rawTime) : 0;
  const [shareTimestamp, setShareTimestamp] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sharingMeeting, setSharingMeeting] = useState<Meeting | null>(null);
  const [sidebarTab, setSidebarTab] = useState<string>("my-calls");

  const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId) || null;

  const handleSelectMeeting = (meetingId: string, timestamp?: number) => {
    navigate(meetingId, timestamp);
  };

  const handleUpdateMeeting = (updated: Meeting) => {
    setMeetings((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  const handleShareMeeting = (meeting: Meeting, timestamp = 0) => {
    setShareTimestamp(timestamp);
    setSharingMeeting(meeting);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#090B0F]">
      {/* 1. Global Header */}
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onNavigateHome={() => {
          navigate();
          setSidebarTab("my-calls");
        }}
      />

      {/* 2. Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Only show sidebar on dashboard views, not inside meeting detail */}
        {!selectedMeeting && (
          <Sidebar
            activeTab={sidebarTab}
            onSelectTab={(tab) => {
              setSidebarTab(tab);
              navigate();
            }}
            totalCallsCount={meetings.length}
          />
        )}

        {/* Dynamic Main Workspace Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {selectedMeeting ? (
            /* Meeting Detail Vertical Slice */
            <MeetingDetailView
              key={`${selectedMeetingId}:${selectedMeetingTimestamp}`}
              meeting={selectedMeeting}
              initialTimestamp={Math.min(selectedMeetingTimestamp, selectedMeeting.duration)}
              onBack={() => {
                navigate();
                setSidebarTab("my-calls");
              }}
              onShare={(timestamp) => handleShareMeeting(selectedMeeting, timestamp)}
              onUpdateMeeting={handleUpdateMeeting}
            />
          ) : sidebarTab === "team-calls" ? (
            /* Team Calls Tab View */
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
              <div className="pb-4 border-b border-[#1E2431]">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <span>Team Calls</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Calls recorded across the engineering, product, and sales workspace teams.
                </p>
              </div>
              <MeetingsDashboard
                activeSubTab={sidebarTab}
                onNavigate={setSidebarTab}
                meetings={meetings.filter((m) => m.category === "Product" || m.category === "Engineering")}
                onSelectMeeting={handleSelectMeeting}
                onShareMeeting={handleShareMeeting}
              />
            </div>
          ) : sidebarTab === "playlists" ? (
            /* Playlists Tab View */
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
              <div className="pb-4 border-b border-[#1E2431]">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <ListMusic className="w-5 h-5 text-purple-400" />
                  <span>Playlists</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Curated reels of key customer quotes, product feedback, and onboarding snippets.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#131722] border border-[#212A3B] space-y-2">
                  <span className="text-xs font-bold text-white">Customer Pain Points Reel</span>
                  <p className="text-xs text-slate-400">4 highlight clips from Acme Corp and FinTech Global demos.</p>
                  <button
                    onClick={() => handleSelectMeeting("m_acme_onboarding", 90)}
                    className="text-xs text-cyan-400 hover:underline inline-flex items-center gap-1 mt-2"
                  >
                    Play playlist →
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-[#131722] border border-[#212A3B] space-y-2">
                  <span className="text-xs font-bold text-white">Q4 Product Milestones</span>
                  <p className="text-xs text-slate-400">Alignment takeaways on November 12th launch.</p>
                  <button
                    onClick={() => handleSelectMeeting("m_prod_strategy", 410)}
                    className="text-xs text-cyan-400 hover:underline inline-flex items-center gap-1 mt-2"
                  >
                    Play playlist →
                  </button>
                </div>
              </div>
            </div>
          ) : sidebarTab === "alerts" || sidebarTab === "deals" ? (
            <div className="p-8 space-y-4">
              <h1 className="text-xl font-bold">{sidebarTab === "alerts" ? "Alerts" : "Deals"}</h1>
              <p className="text-slate-400">{sidebarTab === "alerts" ? "No alerts in this demo workspace. Live notifications are outside this demo." : "CRM integrations are outside this demo. Explore the Sales meeting for a seeded sales review."}</p>
              <button onClick={() => setSidebarTab("my-calls")} className="text-cyan-400">Back to My Calls</button>
            </div>
          ) : (
            /* Default Dashboard: My Calls */
            <MeetingsDashboard
                activeSubTab={sidebarTab}
                onNavigate={setSidebarTab}
              meetings={meetings}
              onSelectMeeting={handleSelectMeeting}
              onShareMeeting={handleShareMeeting}
            />
          )}
        </main>
      </div>

      {/* 3. Global Modals */}
      {isSearchOpen && <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        meetings={meetings}
        onSelectMeeting={(id, ts) => handleSelectMeeting(id, ts)}
      />}

      {sharingMeeting && <ShareModal
        currentTimestamp={shareTimestamp}
        meeting={sharingMeeting}
        isOpen={!!sharingMeeting}
        onClose={() => setSharingMeeting(null)}
      />}
    </div>
  );
}
