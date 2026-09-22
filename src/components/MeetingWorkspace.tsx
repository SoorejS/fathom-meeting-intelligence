"use client";

import React, { useState, useSyncExternalStore, useMemo, useEffect } from "react";
import { readPlaybackTimestamp } from "@/lib/shareLinks";
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

import { useWorkspaceStore } from "@/lib/useWorkspaceStore";
import { PlaylistsView } from "./PlaylistsView";
import { TrackersView } from "./TrackersView";
import { SettingsModal } from "./SettingsModal";
import { UpcomingMeetingsView } from "./UpcomingMeetingsView";
import { filterMeetingsByTeammate } from "@/services/teamService";
import { TeamCallsView } from "./TeamCallsView";
import { HelpFeedbackModal } from "./HelpFeedbackModal";

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
  const params = useMemo(() => new URLSearchParams((location.split("?")[1] || "").split("#")[0]), [location]);
  const sharedCall = useMemo(() => location.startsWith("/share/test") ? readTestCallFragment(location.split("#")[1] || "") : null, [location]);
  const meetings = useMemo(() => sharedCall && !savedMeetings.some(m => m.id === sharedCall.id) ? [createTestMeeting(sharedCall), ...savedMeetings] : savedMeetings, [sharedCall, savedMeetings]);
  useEffect(() => { if (sharedCall) storeGeneratedCall(sharedCall); }, [sharedCall]);
  const capture = useTestCallCapture();
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureMinimized, setCaptureMinimized] = useState(false);
  const showCapture = () => { if (["ready", "complete", "declined"].includes(capture.state.phase)) capture.engine?.open(); setCaptureOpen(true); setCaptureMinimized(false); };
  const selectedMeetingId = params.get("meeting") || (location.startsWith("/share/") ? sharedCall?.id || sharedMeetingId : null);

  const [shareTimestamp, setShareTimestamp] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sharingMeeting, setSharingMeeting] = useState<Meeting | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("my-calls");
  const sidebarTab = useMemo(() => {
    if (params.has("playlist")) return "playlists";
    if (params.has("tracker")) return "alerts";
    return selectedTab;
  }, [params, selectedTab]);

  const {
    storageError: workspaceStorageError,
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

    settings,
    updateRecording,
    updateSummaries,
    updateSharing,
    addHighlightType,
    updateHighlightType,
    reorderHighlightTypes,
    deleteHighlightType,

    upcomingMeetings,
    toggleUpcomingNotetaker,

    visibilities,
    toggleMeetingVisibility,
  } = useWorkspaceStore();

  const selectedMeeting = meetings.find((m) => m.id === selectedMeetingId) || null;

  const playbackStart = readPlaybackTimestamp(params.get("t"), selectedMeeting?.duration || 0);
  const selectedMeetingTimestamp = playbackStart.seconds;
  const selectEntity = (tab: "playlists" | "alerts", id: string) => {
    setIsSettingsOpen(false);
    setSelectedTab(tab);
    setIsMobileMenuOpen(false);
    const url = new URL("/", window.location.origin);
    if (id && id !== "all") url.searchParams.set(tab === "playlists" ? "playlist" : "tracker", id);
    window.history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const handleSelectMeeting = (meetingId: string, timestamp?: number) => {
    setIsSettingsOpen(false);
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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#191919]">
      {/* 1. Global Header */}
      <Header
        onStartTestCall={showCapture}
        onOpenSearch={() => setIsSearchOpen(true)}
        settingsActive={isSettingsOpen}
        onOpenSettings={() => setIsSettingsOpen(value => !value)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onNavigateHome={() => {
          setIsSettingsOpen(false);
          navigate();
          setSelectedTab("my-calls");
          setIsMobileMenuOpen(false);
        }}
      />

      <div className="capture-status-bar">
        <button onClick={() => { if (capture.state.phase === "ready") capture.engine?.open(); setCaptureOpen(true); setCaptureMinimized(false); }} className="text-slate-300 truncate" aria-label="Open Notetaker status">Notetaker · {capture.state.phase === "ready" || capture.state.phase === "precall" ? "Ready" : capture.state.phase === "permission" ? "Permission required" : capture.state.phase === "recording" ? "Recording " + formatTime(capture.state.elapsed) : capture.state.phase === "complete" ? "Complete" : capture.state.phase}</button>
        <button onClick={showCapture} className="shrink-0 text-cyan-300 hover:text-white font-semibold">{["ready","precall","complete","declined"].includes(capture.state.phase) ? "Start Test Call" : "View Test Call"}</button>
      </div>
      {capture.persistenceFailed && <p role="alert" className="p-2 text-xs text-amber-300">Capture recovery cannot be saved in this browser. Keep this page open until processing completes.</p>}
      {location.startsWith("/share/test") && !sharedCall && <p role="alert" className="p-3 text-amber-300 text-sm">This test-call link is incomplete or invalid. Ask the sender to copy the full link, including everything after #.</p>}
      {(storageError || workspaceStorageError) && <p role="status" className="p-2 text-amber-300 text-xs">Browser storage is unavailable. Changes are retained only until this page closes.</p>}
      {selectedMeeting && playbackStart.invalid && <p role="status" className="p-2 text-amber-300 text-xs">The playback timestamp is invalid or outside this meeting. Playback starts at 00:00.</p>}
      {/* 2. Workspace Body */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {/* Keep library navigation above dashboard views, outside meeting detail */}
        {!selectedMeeting && !isSettingsOpen && (
          <Sidebar
            notetakerStatus={capture.state.phase}
            activeTab={sidebarTab}
            onSelectTab={(tab) => {
              setIsSettingsOpen(false);
              setSelectedTab(tab);
              navigate();
            }}
            totalCallsCount={meetings.length}
            teamCallsCount={filterMeetingsByTeammate(meetings, "All", visibilities).length}
            playlists={playlists}
            onSelectPlaylist={id => selectEntity("playlists", id)}
            trackersCount={trackers.filter(t => t.enabled).length}
            upcomingCount={upcomingMeetings.length}
            onCreatePlaylistClick={() => {
              setSelectedTab("playlists");
            }}
          />
        )}

        {/* Dynamic Main Workspace Area */}
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {isSettingsOpen ? <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onUpdateRecording={updateRecording}
            onUpdateSummaries={updateSummaries}
            onUpdateSharing={updateSharing}
            onAddHighlightType={addHighlightType}
            onUpdateHighlightType={updateHighlightType}
            onReorderHighlightTypes={reorderHighlightTypes}
            onDeleteHighlightType={deleteHighlightType}
          /> : selectedMeeting ? (
                /* Meeting Detail Vertical Slice */
            <MeetingDetailView
              key={`${selectedMeetingId}:${selectedMeetingTimestamp}`}
              highlightTypes={settings.highlights.types}
              meeting={selectedMeeting}
              summaryTemplate={templates[selectedMeeting.id] || settings.summaries.defaultTemplate}
              onTemplateChange={template => setTemplate(selectedMeeting.id, template)}
              initialTimestamp={Math.min(selectedMeetingTimestamp, selectedMeeting.duration)}
              onBack={() => {
                navigate();
                setSelectedTab("my-calls");
              }}
              onShare={(timestamp) => handleShareMeeting(selectedMeeting, timestamp)}
              onUpdateMeeting={handleUpdateMeeting}
              playlists={playlists}
              onAddToPlaylist={(mId, hId, pId) => addHighlightToPlaylist(pId, mId, hId)}
            />
          ) : sidebarTab === "team-calls" ? (
            /* Team Calls Tab View */
            <TeamCallsView
              meetings={meetings}
              visibilities={visibilities}
              onToggleVisibility={toggleMeetingVisibility}
              onSelectMeeting={handleSelectMeeting}
              onShareMeeting={handleShareMeeting}
            />
          ) : sidebarTab === "upcoming" ? (
            /* Upcoming Calendar Meetings View */
            <UpcomingMeetingsView
              upcomingMeetings={upcomingMeetings}
              onToggleNotetaker={toggleUpcomingNotetaker}
              onStartTestCall={showCapture}
            />
          ) : sidebarTab === "playlists" ? (
            /* Full Real Playlists View */
            <PlaylistsView
              selectedPlaylistId={params.get("playlist") ?? undefined}
              onSelectPlaylist={id => selectEntity("playlists", id)}
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
              selectedTrackerId={params.get("tracker") || "all"}
              onSelectTracker={id => selectEntity("alerts", id)}
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
              <button onClick={() => setSelectedTab("my-calls")} className="text-cyan-400 hover:underline">
                Back to My Calls
              </button>
            </div>
          ) : (
            /* Default Dashboard: My Calls */
            <MeetingsDashboard
              activeSubTab={sidebarTab}
              onNavigate={setSelectedTab}
              meetings={meetings}
              onSelectMeeting={handleSelectMeeting}
              onShareMeeting={handleShareMeeting}
              upcomingMeetings={upcomingMeetings}
              onToggleUpcomingNotetaker={toggleUpcomingNotetaker}
              onStartTestCall={showCapture}
            />
          )}
        </main>
      </div>

      {/* Mobile Sidebar Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true" aria-label="Mobile Navigation Drawer">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-[85vw] bg-[#191919] border-r border-slate-800 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Workspace Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                aria-label="Close navigation menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar
                isMobileDrawer={true}
                notetakerStatus={capture.state.phase}
                activeTab={sidebarTab}
                onSelectTab={(tab) => {
                  setIsSettingsOpen(false);
                  setSelectedTab(tab);
                  setIsMobileMenuOpen(false);
                  navigate();
                }}
                totalCallsCount={meetings.length}
                teamCallsCount={filterMeetingsByTeammate(meetings, "All", visibilities).length}
                playlists={playlists}
                onSelectPlaylist={id => selectEntity("playlists", id)}
                trackersCount={trackers.filter(t => t.enabled).length}
                upcomingCount={upcomingMeetings.length}
                onCreatePlaylistClick={() => {
                  setSelectedTab("playlists");
                  setIsMobileMenuOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {captureOpen && capture.engine && <TestCallPanel minimized={captureMinimized} onMinimize={() => setCaptureMinimized(true)} onRestore={() => setCaptureMinimized(false)} state={capture.state} engine={capture.engine} onClose={() => { if (["precall","joining","permission","declined"].includes(capture.state.phase)) capture.engine?.cancel(); setCaptureOpen(false); }} onOpenMeeting={handleSelectMeeting} />}
      {/* 3. Global Modals */}
      {isSearchOpen && <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        meetings={meetings}
        playlists={playlists}
        trackers={trackers}
        onSelectEntity={selectEntity}
        onSelectMeeting={(id, ts) => handleSelectMeeting(id, ts)}
      />}

      {sharingMeeting && <ShareModal
        currentTimestamp={shareTimestamp}
        meeting={sharingMeeting}
        isOpen={!!sharingMeeting}
        onClose={() => setSharingMeeting(null)}
      />}


      <HelpFeedbackModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onOpenTestCall={showCapture}
      />
    </div>
  );
}
