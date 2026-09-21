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
import { useWorkspaceStore } from "@/lib/useWorkspaceStore";
import { PlaylistsView } from "./PlaylistsView";
import { TrackersView } from "./TrackersView";

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

  const {
    playlists,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addHighlightToPlaylist,
    removeClip,
    reorderClips,

    trackers,
    createTracker,
    updateTracker,
    toggleTracker,
    deleteTracker,
  } = useWorkspaceStore();

  useEffect(() => {
    if (params.get("playlist")) {
      setSidebarTab("playlists");
    }
  }, [params]);

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
            playlists={playlists}
            trackersCount={trackers.filter(t => t.enabled).length}
            onCreatePlaylistClick={() => {
              setSidebarTab("playlists");
            }}
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
              playlists={playlists}
              onAddToPlaylist={(mId, hId, pId) => addHighlightToPlaylist(pId, mId, hId)}
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
            /* Full Real Playlists View */
            <PlaylistsView
              playlists={playlists}
              meetings={meetings}
              onCreatePlaylist={createPlaylist}
              onRenamePlaylist={renamePlaylist}
              onDeletePlaylist={deletePlaylist}
              onRemoveClip={removeClip}
              onReorderClips={reorderClips}
              onNavigateMeeting={(meetingId, timestamp) => {
                handleSelectMeeting(meetingId, timestamp);
              }}
            />
          ) : sidebarTab === "alerts" ? (
            /* Alerts & Keyword Trackers View */
            <TrackersView
              trackers={trackers}
              meetings={meetings}
              onCreateTracker={createTracker}
              onUpdateTracker={updateTracker}
              onToggleTracker={toggleTracker}
              onDeleteTracker={deleteTracker}
              onNavigateMeeting={(meetingId, timestamp) => {
                handleSelectMeeting(meetingId, timestamp);
              }}
            />
          ) : sidebarTab === "deals" ? (
            <div className="p-8 space-y-4">
              <h1 className="text-xl font-bold text-white">Deals & Pipeline</h1>
              <p className="text-slate-400">
                Explore the sales and enterprise demo recordings to see deal reviews and follow-up commitments.
              </p>
              <button onClick={() => setSidebarTab("my-calls")} className="text-cyan-400 hover:underline">
                Back to My Calls
              </button>
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
