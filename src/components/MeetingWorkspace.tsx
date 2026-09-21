"use client";

import React, { useState, useSyncExternalStore, useMemo, useEffect } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { MeetingsDashboard } from "@/components/MeetingsDashboard";
import { MeetingDetailView } from "@/components/MeetingDetailView";
import { GlobalSearchModal } from "@/components/GlobalSearchModal";
import { ShareModal } from "@/components/ShareModal";
import { useMeetingStore, storeGeneratedCall } from "@/lib/useMeetingStore";
import { Meeting } from "@/types/meeting";
import { TestCallPanel } from "./TestCallPanel";
import { useTestCallCapture } from "@/lib/useTestCallCapture";
import { readTestCallFragment, createTestMeeting, formatTime } from "@/lib/testCallMeeting";
import { Users, ListMusic } from "lucide-react";

function subscribeToUrl(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener("hashchange", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("hashchange", callback);
  };
}
function navigate(meetingId?: string, timestamp?: number) {
  const url = new URL(window.location.href);
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  if (meetingId) url.searchParams.set("meeting", meetingId);
  if (timestamp !== undefined) url.searchParams.set("t", String(timestamp));
  window.history.pushState({}, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
export function MeetingWorkspace({ sharedMeetingId }: { sharedMeetingId?: string }) {
  const { meetings: savedMeetings, updateMeeting, templates, setTemplate, storageError } = useMeetingStore();
  const location = useSyncExternalStore(subscribeToUrl, () => window.location.pathname + window.location.search + window.location.hash, () => sharedMeetingId ? "/share/" + sharedMeetingId : "/");
  const params = new URLSearchParams((location.split("?")[1] || "").split("#")[0]);
  const sharedCall = useMemo(() => location.startsWith("/share/test") ? readTestCallFragment(location.split("#")[1] || "") : null, [location]);
  const meetings = useMemo(() => sharedCall && !savedMeetings.some(m => m.id === sharedCall.id) ? [createTestMeeting(sharedCall), ...savedMeetings] : savedMeetings, [sharedCall, savedMeetings]);
  useEffect(() => { if (sharedCall) storeGeneratedCall(sharedCall); }, [sharedCall]);
  const capture = useTestCallCapture();
  const [captureOpen, setCaptureOpen] = useState(false);
  const showCapture = () => { if (["ready", "complete", "declined"].includes(capture.state.phase)) capture.engine?.open(); setCaptureOpen(true); };
  const selectedMeetingId = params.get("meeting") || (location.startsWith("/share/") ? sharedCall?.id || sharedMeetingId : null);
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
    updateMeeting(updated);
  };

  const handleShareMeeting = (meeting: Meeting, timestamp = 0) => {
    setShareTimestamp(timestamp);
    setSharingMeeting(meeting);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#090B0F]">
      {/* 1. Global Header */}
      <Header
        onStartTestCall={showCapture}
        onOpenSearch={() => setIsSearchOpen(true)}
        onNavigateHome={() => {
          navigate();
          setSidebarTab("my-calls");
        }}
      />

      <div className="flex items-center justify-between gap-2 border-b border-slate-800 bg-[#10151d] px-4 py-2 text-xs">
        <button onClick={() => { if (capture.state.phase === "ready") capture.engine?.open(); setCaptureOpen(true); }} className="text-slate-300 truncate" aria-label="Open Notetaker status">Notetaker · {capture.state.phase === "ready" || capture.state.phase === "precall" ? "Ready" : capture.state.phase === "permission" ? "Permission required" : capture.state.phase === "recording" ? "Recording " + formatTime(capture.state.elapsed) : capture.state.phase === "complete" ? "Complete" : capture.state.phase}</button>
        <button onClick={showCapture} className="shrink-0 text-cyan-300 hover:text-white font-semibold">{["ready","precall","complete","declined"].includes(capture.state.phase) ? "Start Test Call" : "View Test Call"}</button>
      </div>
      {capture.persistenceFailed && <p role="alert" className="p-2 text-xs text-amber-300">Capture recovery cannot be saved in this browser. Keep this page open until processing completes.</p>}
      {location.startsWith("/share/test") && !sharedCall && <p role="alert" className="p-3 text-amber-300 text-sm">This test-call link is incomplete or invalid. Ask the sender to copy the full link, including everything after #.</p>}
      {storageError && <p role="status" className="p-2 text-amber-300 text-xs">Browser storage is unavailable. Changes are retained only until this page closes.</p>}
      {/* 2. Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Only show sidebar on dashboard views, not inside meeting detail */}
        {!selectedMeeting && (
          <Sidebar
            notetakerStatus={capture.state.phase}
            activeTab={sidebarTab}
            onSelectTab={(tab) => {
              setSidebarTab(tab);
              navigate();
            }}
            totalCallsCount={meetings.length}
            teamCallsCount={meetings.filter(m => m.category === "Product" || m.category === "Engineering").length}
          />
        )}

        {/* Dynamic Main Workspace Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {selectedMeeting ? (
            /* Meeting Detail Vertical Slice */
            <MeetingDetailView
              key={`${selectedMeetingId}:${selectedMeetingTimestamp}`}
              meeting={selectedMeeting}
              summaryTemplate={templates[selectedMeeting.id] || "default"}
              onTemplateChange={template => setTemplate(selectedMeeting.id, template)}
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

      {captureOpen && capture.engine && <TestCallPanel state={capture.state} engine={capture.engine} onClose={() => { if (["precall","joining","permission","declined"].includes(capture.state.phase)) capture.engine?.cancel(); setCaptureOpen(false); }} onOpenMeeting={handleSelectMeeting} />}
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
