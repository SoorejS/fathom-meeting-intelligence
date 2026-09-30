"use client";
import { Fragment, useState, useEffect, useCallback } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  AudioLines,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Database,
  Folder,
  LayoutDashboard,
  Menu,
  Mic,
  Plus,
  Radio,
  Search,
  Settings2,
  Signal,
  Sun,
  X,
} from "lucide-react";
import type { Meeting } from "@/types/meeting";
import type { SearchResult } from "@/lib/workspaceSearch";
import type { Tracker, TrackerMatch } from "@/types/tracker";
import { api } from "@/lib/api";
import { useTestCallCapture } from "@/lib/useTestCallCapture";
import { TestCallPanel } from "../TestCallPanel";
import { MeetingPane } from "./MeetingPane";
import { Dialog } from "./Dialog";
import { ThemeToggle } from "./ThemeToggle";
import { WorkspacePreferences } from "./WorkspacePreferences";
import { WorkspaceIntegrations } from "./WorkspaceIntegrations";
import { RelayHelp } from "./RelayHelp";
import { UpcomingSessions } from "./UpcomingSessions";
import { CollectionReel } from "./CollectionReel";
import type { Playlist } from "@/types/playlist";
import { formatTime } from "@/lib/testCallMeeting";
import { readPlaybackTimestamp } from "@/lib/shareLinks";

type Collection = Playlist;
const sections = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Sessions", icon: AudioLines },
  { name: "Action desk", icon: CheckCircle2 },
  { name: "Collections", icon: Folder },
  { name: "Signals", icon: Signal },
  { name: "Capture studio", icon: Mic },
  { name: "Settings", icon: Settings2 },
];
export function RelayApp() {
  const [view, setView] = useState("Overview"),
    [meetings, setMeetings] = useState<Meeting[]>([]),
    [selected, setSelected] = useState<Meeting | null>(null),
    [selectedTime, setSelectedTime] = useState(0),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [mobileNav, setMobileNav] = useState(false),
    [search, setSearch] = useState(false),
    [query, setQuery] = useState(""),
    [results, setResults] = useState<SearchResult[]>([]),
    [searching, setSearching] = useState(false),
    [searchError, setSearchError] = useState("");
  const [filter, setFilter] = useState("All"),
    [libraryQuery, setLibraryQuery] = useState(""),
    [collections, setCollections] = useState<Collection[]>([]),
    [trackers, setTrackers] = useState<Tracker[]>([]),
    [matches, setMatches] = useState<TrackerMatch[]>([]);
  const [dialog, setDialog] = useState<"collection" | "signal" | "help" | null>(
      null,
    ),
    [newName, setNewName] = useState(""),
    [keywords, setKeywords] = useState(""),
    [addingTo, setAddingTo] = useState<string | null>(null),
    [compact, setCompact] = useState(false);
  const [captureVisible, setCaptureVisible] = useState(false),
    [minimized, setMinimized] = useState(false);
  const [sortBy, setSortBy] = useState("newest"),
    [libraryScope, setLibraryScope] = useState("all"),
    [teammate, setTeammate] = useState("All"),
    [actionStatus, setActionStatus] = useState("all");
  const [editing, setEditing] = useState<string | null>(null),
    [description, setDescription] = useState(""),
    [scope, setScope] = useState<string[]>([]),
    [selectedSignal, setSelectedSignal] = useState("all"),
    [signalQuery, setSignalQuery] = useState("");
  const [reel, setReel] = useState<Playlist | null>(null),
    [entity, setEntity] = useState(""),
    [searchType, setSearchType] = useState("all"),
    [searchIndex, setSearchIndex] = useState(0),
    [selectedTab, setSelectedTab] = useState("Brief"),
    [captureTitle, setCaptureTitle] = useState("Release readiness · Test Call");
  const [overviewAnswer, setOverviewAnswer] = useState(""),
    [overviewQuestion, setOverviewQuestion] = useState(""),
    [settingsTab, setSettingsTab] = useState<
      "all" | "preferences" | "appearance" | "integrations"
    >("all");
  const capture = useTestCallCapture();
  const load = useCallback(async () => {
    try {
      const data = await api<Meeting[]>("/meetings");
      setMeetings(data);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  const loadCollections = useCallback(async () => {
    setCollections(await api<Collection[]>("/playlists"));
  }, []);
  const loadSignals = useCallback(async () => {
    const [t, m] = await Promise.all([
      api<Tracker[]>("/trackers"),
      api<TrackerMatch[]>("/trackers/matches"),
    ]);
    setTrackers(t);
    setMatches(m);
  }, []);
  const openMeeting = useCallback(
    async (id: string, time = 0, tab = "Brief") => {
      setBusy(true);
      try {
        const m = await api<Meeting>(`/meetings/${id}`);
        setSelected(m);
        setSelectedTab(tab);
        setSelectedTime(time);
        setSearch(false);
        setMobileNav(false);
        history.pushState(
          null,
          "",
          `/?meeting=${encodeURIComponent(id)}&t=${time}`,
        );
        window.scrollTo(0, 0);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [],
  );
  useEffect(() => {
    api<Meeting[]>("/meetings")
      .then((data) => {
        setMeetings(data);
        try {
          setCompact(localStorage.getItem("relay-density") === "compact");
        } catch {}
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    const restore = () => {
      const u = new URL(location.href);
      const id = u.searchParams.get("meeting");
      if (id)
        api<Meeting>(`/meetings/${encodeURIComponent(id)}`)
          .then((m) => {
            setSelected(m);
            const parsed = readPlaybackTimestamp(
              u.searchParams.get("t"),
              m.duration,
            );
            setSelectedTime(parsed.seconds);
            if (parsed.invalid)
              setError(
                "The linked timestamp was invalid. Playback starts at the beginning.",
              );
          })
          .catch((e) => setError(e.message));
      else {
        setSelected(null);
        if (u.searchParams.has("playlist")) {
          setView("Collections");
          setEntity(u.searchParams.get("playlist") || "");
          void loadCollections().catch((e) => setError(e.message));
        } else if (u.searchParams.has("tracker")) {
          setView("Signals");
          setSelectedSignal(u.searchParams.get("tracker") || "all");
          void loadSignals().catch((e) => setError(e.message));
        }
      }
    };
    restore();
    window.addEventListener("relay:meetings", load);
    window.addEventListener("popstate", restore);
    return () => {
      window.removeEventListener("relay:meetings", load);
      window.removeEventListener("popstate", restore);
    };
  }, [load, loadCollections, loadSignals]);
  useEffect(() => {
    const shortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  useEffect(() => {
    if (!search || !query.trim()) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
      setSearchError("");
      api<SearchResult[]>(
        `/search?q=${encodeURIComponent(query)}`,
        "GET",
        undefined,
        controller.signal,
      )
        .then(setResults)
        .catch((e) => {
          if (e.name !== "AbortError") setSearchError(e.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, query]);
  function navigate(next: string) {
    setEntity("");
    setView(next);
    setSelected(null);
    setMobileNav(false);
    history.pushState(null, "", "/");
    window.scrollTo(0, 0);
    if (next === "Collections")
      void loadCollections().catch((e) => setError(e.message));
    if (next === "Signals")
      void loadSignals().catch((e) => setError(e.message));
  }
  function startCall(title = "Release readiness · Test Call") {
    setCaptureTitle(title);
    capture.engine?.open();
    setCaptureVisible(true);
    setMinimized(false);
  }
  async function run(task: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const actions = meetings.flatMap((m) =>
    m.actionItems.map((a) => ({ ...a, meetingTitle: m.title })),
  );
  const openActions = actions.filter((a) => a.status === "open");
  const visible = meetings
    .filter(
      (m) =>
        (filter === "All" || m.category === filter) &&
        (libraryScope !== "team" || m.visibility === "team") &&
        (libraryScope !== "personal" || m.visibility === "personal") &&
        (teammate === "All" ||
          m.owner === teammate ||
          m.participants.some((p) => p.name === teammate)) &&
        (
          m.title +
          " " +
          m.summary.default.overview +
          " " +
          m.participants.map((p) => p.name).join(" ")
        )
          .toLowerCase()
          .includes(libraryQuery.toLowerCase()),
    )
    .sort((a, b) =>
      sortBy === "duration"
        ? b.duration - a.duration
        : Date.parse(b.date) - Date.parse(a.date),
    );
  const resultClick = (r: SearchResult) => {
    if (r.meetingId)
      void openMeeting(
        r.meetingId,
        r.timestamp || 0,
        r.type === "transcript"
          ? "Conversation"
          : r.type === "highlight"
            ? "Moments"
            : r.type === "actionItem"
              ? "Follow-through"
              : "Brief",
      );
    else {
      setSearch(false);
      navigate(r.type === "playlist" ? "Collections" : "Signals");
      setEntity(r.entityId || "");
      if (r.type === "tracker") setSelectedSignal(r.entityId || "all");
    }
  };
  return (
    <div className={`relay-shell ${compact ? "compact" : ""}`}>
      {mobileNav && (
        <button
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside className={`relay-nav ${mobileNav ? "mobile-open" : ""}`}>
        <button
          className="brand"
          onClick={() => navigate("Overview")}
          aria-label="Relay home"
        >
          <span className="brand-mark">
            <AudioLines size={22} />
          </span>
          relay<span className="brand-period">.</span>
        </button>
        <div className="workspace-label">
          <span className="workspace-avatar">S</span>
          <div>
            <strong>Soorej’s workspace</strong>
            <small>Shared demo</small>
          </div>
        </div>
        <button className="nav-search" onClick={() => setSearch(true)}>
          <Search size={16} />
          Find anything <kbd>⌘ K</kbd>
        </button>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {sections.map(({ name, icon: Icon }) => {
            const active =
              !selected &&
              (view === name ||
                (name === "Settings" &&
                  (view === "Settings" || view === "Preferences")));
            return (
              <button
                key={name}
                className={active ? "active" : ""}
                onClick={() => navigate(name)}
              >
                <Icon size={18} />
                {name}
                {name === "Action desk" && openActions.length > 0 && (
                  <span>{openActions.length}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="nav-theme-wrap" aria-label="Appearance theme">
          <ThemeToggle />
        </div>
        <div className="nav-bottom">
          <button onClick={() => setDialog("help")}>
            <CircleHelp size={17} />A quick guide
          </button>
          <div className="nav-note">
            <span className="status-dot" />
            Built for the follow-through.
            <p>
              Less rewatching.
              <br />
              More moving forward.
            </p>
          </div>
          <div className="nav-profile">
            <span>S</span>
            <div>
              <strong>Soorej</strong>
              <small>Product workspace</small>
            </div>
            <ArrowUpRight size={16} />
          </div>
        </div>
      </aside>
      <div className="relay-content">
        <header className="topbar">
          <button
            className="mobile-menu icon-btn"
            aria-label="Open navigation"
            onClick={() => setMobileNav(true)}
          >
            <Menu size={22} />
          </button>
          <div className="topbar-path">
            Workspace <ChevronRight size={14} />{" "}
            <strong>
              {selected
                ? "Session"
                : view === "Preferences"
                  ? "Settings"
                  : view}
            </strong>
          </div>
          <div>
            <span className="connection">
              <span className={`status-dot ${error ? "offline" : ""}`} />
              {loading
                ? "Connecting"
                : error
                  ? "Connection issue"
                  : busy
                    ? "Working…"
                    : "Database connected"}
            </span>
            <button className="primary" onClick={() => startCall()}>
              <Plus size={16} />
              New session
            </button>
          </div>
        </header>
        <main className="relay-main">
          {error && (
            <div className="notice error" role="alert">
              <div>
                <strong>We couldn’t save or load that change.</strong>
                <p>{error}</p>
              </div>
              <button className="secondary" onClick={() => void load()}>
                Retry
              </button>
            </div>
          )}
          {loading ? (
            <div className="loading" role="status">
              <AudioLines size={32} />
              <h2>Gathering your conversations…</h2>
              <p>Loading the workspace from the database.</p>
            </div>
          ) : selected ? (
            <MeetingPane
              key={selected.id + ":" + selectedTime}
              initial={selected}
              initialTab={selectedTab}
              initialTime={Math.min(
                selected.duration,
                Math.max(0, selectedTime),
              )}
              onBack={() => navigate("Sessions")}
              onChanged={() => void load()}
            />
          ) : (
            <>
              {(view === "Overview" || view === "Sessions") && (
                <>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">
                        {view === "Overview"
                          ? "CONVERSATIONS → CLARITY"
                          : "YOUR COLLECTIVE MEMORY"}
                      </p>
                      <h1>
                        {view === "Overview"
                          ? "Good conversations.\nClear next steps."
                          : "Every session, in context."}
                      </h1>
                      <p className="page-description">
                        {view === "Overview"
                          ? "The decisions, ideas, and commitments that move your team forward."
                          : "Pick up the thread. Find the moment. Keep the work moving."}
                      </p>
                    </div>
                    {view === "Overview" && (
                      <div className="edition-mark">
                        <Radio size={27} />
                        <span>
                          THE WORKSPACE
                          <br />
                          FOR WHAT’S NEXT
                        </span>
                      </div>
                    )}
                  </div>
                  {view === "Overview" && (
                    <>
                      <div className="metric-grid">
                        <div>
                          <span>Conversations captured</span>
                          <strong>
                            {meetings.length.toString().padStart(2, "0")}
                            <AudioLines size={24} />
                          </strong>
                          <small>Shared context, ready to revisit</small>
                        </div>
                        <div>
                          <span>Waiting on a next step</span>
                          <strong>
                            {openActions.length.toString().padStart(2, "0")}
                            <ArrowUpRight size={24} />
                          </strong>
                          <button onClick={() => navigate("Action desk")}>
                            Open the action desk <ArrowRight size={13} />
                          </button>
                        </div>
                        <div>
                          <span>Moments worth keeping</span>
                          <strong>
                            {meetings
                              .reduce((n, m) => n + m.highlights.length, 0)
                              .toString()
                              .padStart(2, "0")}
                            <BookOpen size={24} />
                          </strong>
                          <small>Ideas that shouldn’t get lost</small>
                        </div>
                      </div>
                      <div className="follow-banner">
                        <span className="banner-symbol">
                          <CheckCircle2 size={23} />
                        </span>
                        <div>
                          <span className="eyebrow">CLOSE THE LOOP</span>
                          <p>
                            {openActions[0]?.text ||
                              "You’re all caught up. Make room for the next conversation."}
                          </p>
                          {openActions[0] && (
                            <small>
                              {openActions[0].owner} ·{" "}
                              {openActions[0].meetingTitle}
                            </small>
                          )}
                        </div>
                        <button
                          aria-label="Review next action"
                          onClick={() =>
                            openActions[0]
                              ? void openMeeting(openActions[0].meetingId)
                              : startCall()
                          }
                        >
                          <ArrowUpRight size={22} />
                        </button>
                      </div>
                    </>
                  )}
                  {view === "Overview" && (
                    <section className="preference-card">
                      <h2>Ask your workspace</h2>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const submitter=(e.nativeEvent as SubmitEvent).submitter;
                          const prompt=(submitter instanceof HTMLButtonElement && submitter.value) || overviewQuestion;
                          setOverviewQuestion(prompt);
                          const q = prompt.toLowerCase();
                          setOverviewAnswer(
                            q.includes("action")
                              ? openActions
                                  .map((a) => a.owner + ": " + a.text)
                                  .join(" · ") || "No open follow-ups."
                              : q.includes("decision")
                                ? meetings
                                    .map(
                                      (m) =>
                                        m.title +
                                        ": " +
                                        m.summary.default.decisions.join(" "),
                                    )
                                    .join(" · ")
                                : q.includes("summar")
                                  ? meetings
                                      .map(
                                        (m) =>
                                          m.title +
                                          ": " +
                                          m.summary.default.overview,
                                      )
                                      .join(" · ")
                                  : "Ask about actions, decisions or summaries, or open a session for answers with transcript evidence.",
                          );
                        }}
                      >
                        <label>
                          Question
                          <input
                            value={overviewQuestion}
                            onChange={(e) =>
                              setOverviewQuestion(e.target.value)
                            }
                            placeholder="Show open action items"
                          />
                        </label>
                        <button className="secondary">Ask workspace</button>
                        <div className="button-row">{["Show open action items","Summarize my sessions","What decisions were made?"].map(q=><button className="text-button" type="submit" value={q} key={q}>{q}</button>)}</div>
                      </form>
                      <p role="status">{overviewAnswer}</p>
                    </section>
                  )}
                  <div className="section-title library-title">
                    <div>
                      <h2>
                        {view === "Overview"
                          ? "The conversation shelf"
                          : "Session library"}
                      </h2>
                      <p className="muted small">
                        {visible.length} sessions ·{" "}
                        {sortBy === "newest" ? "newest first" : "longest first"}
                      </p>
                    </div>
                    <label className="inline-search">
                      <Search size={16} />
                      <input
                        aria-label="Filter sessions"
                        placeholder="Title or person…"
                        value={libraryQuery}
                        onChange={(e) => setLibraryQuery(e.target.value)}
                      />
                    </label>
                  </div>
                  {view === "Sessions" && (
                    <div className="button-row library-controls">
                      <label>
                        Library
                        <select
                          value={libraryScope}
                          onChange={(e) => setLibraryScope(e.target.value)}
                        >
                          <option value="all">All sessions</option>
                          <option value="team">Team sessions</option>
                          <option value="personal">Personal sessions</option>
                          <option value="upcoming">Scheduled sessions</option>
                        </select>
                      </label>
                      <label>
                        Person
                        <select
                          value={teammate}
                          onChange={(e) => setTeammate(e.target.value)}
                        >
                          {[
                            "All",
                            ...new Set(
                              meetings.flatMap((m) => [
                                m.owner || "Soorej",
                                ...m.participants.map((p) => p.name),
                              ]),
                            ),
                          ].map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Sort
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                        >
                          <option value="newest">Newest first</option>
                          <option value="duration">Longest first</option>
                        </select>
                      </label>
                    </div>
                  )}
                  {view === "Sessions" && libraryScope === "upcoming" && (
                    <UpcomingSessions onCapture={startCall} />
                  )}
                  <div className="filter-row">
                    {["All", ...new Set(meetings.map((m) => m.category))].map(
                      (c) => (
                        <button
                          key={c}
                          className={filter === c ? "selected" : ""}
                          onClick={() => setFilter(c)}
                        >
                          {c}
                        </button>
                      ),
                    )}
                  </div>
                  <div className="session-grid">
                    {(libraryScope === "upcoming" && view === "Sessions"
                      ? []
                      : visible
                    ).map((m, i) => (
                      <Fragment key={m.id}>
                        {view === "Sessions" &&
                          sortBy === "newest" &&
                          (i === 0 ||
                            visible[i - 1].date.slice(0, 10) !==
                              m.date.slice(0, 10)) && (
                            <h2 className="session-date-group">
                              {new Date(m.date).toLocaleDateString("en-US", {
                                dateStyle: "long",
                                timeZone: "UTC",
                              })}
                            </h2>
                          )}
                        <button
                          className="session-card"
                          key={m.id}
                          onClick={() => void openMeeting(m.id)}
                          aria-label={`Open ${m.title}`}
                        >
                          <div className={`card-art art-${i % 4}`}>
                            <span className="card-category">{m.category}</span>
                            <div className="wave-art" aria-hidden="true">
                              {[
                                22, 38, 58, 31, 75, 46, 88, 59, 36, 68, 92, 51,
                                77, 42, 64, 33, 51, 26,
                              ].map((h, n) => (
                                <i key={n} style={{ height: h + "%" }} />
                              ))}
                            </div>
                            <span className="card-duration">
                              {m.durationFormatted}
                            </span>
                          </div>
                          <div className="card-body">
                            <p className="eyebrow">{m.dateFormatted}</p>
                            <h3>{m.title}</h3>
                            <p className="card-summary">
                              {m.summary.default.overview}
                            </p>
                            <div className="card-footer">
                              <div className="avatars">
                                {m.participants.slice(0, 3).map((p) => (
                                  <span title={p.name} key={p.id}>
                                    {p.initials}
                                  </span>
                                ))}
                                {m.participants.length > 3 && (
                                  <small>+{m.participants.length - 3}</small>
                                )}
                              </div>
                              <span>
                                {
                                  m.actionItems.filter(
                                    (a) => a.status === "open",
                                  ).length
                                }{" "}
                                next steps <ArrowUpRight size={15} />
                              </span>
                            </div>
                          </div>
                        </button>
                      </Fragment>
                    ))}
                  </div>
                  {!visible.length && (
                    <div className="empty">
                      <Search size={25} />
                      <h2>
                        {meetings.length
                          ? "No matching sessions"
                          : "Your workspace is ready"}
                      </h2>
                      <p>
                        {meetings.length
                          ? "Try a different title, person, or category."
                          : "Create a test session, or run the database seed to add the example conversations."}
                      </p>
                      <button
                        className="secondary"
                        onClick={() => {
                          setFilter("All");
                          setLibraryQuery("");
                          setTeammate("All");setLibraryScope("all");
                        }}
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </>
              )}
              {view === "Action desk" && (
                <>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">FROM SAID TO DONE</p>
                      <h1>The action desk.</h1>
                      <p className="page-description">
                        Every commitment, with the conversation behind it.
                      </p>
                    </div>
                    <span className="large-number">
                      {openActions.length}
                      <small>OPEN</small>
                    </span>
                  </div>
                  <div className="desk-list">
                    <label>
                      Show follow-ups
                      <select
                        value={actionStatus}
                        onChange={(e) => setActionStatus(e.target.value)}
                      >
                        {["all", "open", "completed"].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                    {actions
                      .filter(
                        (a) =>
                          actionStatus === "all" || a.status === actionStatus,
                      )
                      .map((a) => (
                        <article
                          key={a.id}
                          className={`action-row ${a.status === "completed" ? "done" : ""}`}
                        >
                          <button
                            role="checkbox"
                            aria-checked={a.status === "completed"}
                            aria-label={`Complete ${a.text}`}
                            disabled={busy}
                            className="check-control"
                            onClick={() =>
                              void run(async () => {
                                await api(`/action-items/${a.id}`, "PATCH", {
                                  status:
                                    a.status === "open" ? "completed" : "open",
                                });
                                await load();
                              })
                            }
                          >
                            {a.status === "completed" && <Check size={16} />}
                          </button>
                          <div>
                            <p>{a.text}</p>
                            <small>
                              {a.owner} · {a.dueDate || "No due date"}
                            </small>
                            <button
                              className="text-button small"
                              onClick={() =>
                                void openMeeting(a.meetingId, a.sourceTimestamp)
                              }
                            >
                              {a.meetingTitle} <ArrowUpRight size={12} />
                            </button>
                          </div>
                        </article>
                      ))}
                  </div>
                </>
              )}
              {view === "Collections" && (
                <>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">CONTEXT, CURATED</p>
                      <h1>Make the moments connect.</h1>
                      <p className="page-description">
                        Build a reading list from the highlights across your
                        sessions.
                      </p>
                    </div>
                    <button
                      className="primary"
                      onClick={() => {
                        setNewName("");
                        setEditing(null);
                        setDescription("");
                        setDialog("collection");
                      }}
                    >
                      <Plus size={16} />
                      New collection
                    </button>
                  </div>
                  <div className="collection-grid">
                    {entity && (
                      <button
                        className="text-button"
                        onClick={() => setEntity("")}
                      >
                        Show all collections
                      </button>
                    )}
                    {collections
                      .filter((c) => !entity || c.id === entity)
                      .map((c) => (
                        <section className="collection-card" key={c.id}>
                          <Folder size={24} />
                          <h2>{c.title}</h2>
                          <div className="button-row">
                            <button
                              className="text-button"
                              onClick={() => {
                                setEditing(c.id);
                                setNewName(c.title);
                                setDescription(c.description || "");
                                setDialog("collection");
                              }}
                            >
                              Edit collection
                            </button>
                            <button
                              className="text-button"
                              disabled={busy}
                              onClick={() =>
                                void run(async () => {
                                  await api(`/playlists/${c.id}`, "DELETE");
                                  await loadCollections();
                                  setEntity("");
                                })
                              }
                            >
                              Delete collection
                            </button>
                            <button
                              className="text-button"
                              disabled={!c.items.length}
                              onClick={() => setReel(c)}
                            >
                              Play reel
                            </button>
                            <button
                              className="text-button"
                              onClick={() => {
                                void navigator.clipboard
                                  .writeText(
                                    location.origin +
                                      "/?playlist=" +
                                      encodeURIComponent(c.id),
                                  )
                                  .catch(() =>
                                    setError(
                                      "Copy this collection URL: " +
                                        location.origin +
                                        "/?playlist=" +
                                        c.id,
                                    ),
                                  );
                              }}
                            >
                              Copy collection link
                            </button>
                          </div>
                          <p className="muted">
                            {c.description ||
                              "A collection of moments worth sharing with your team."}
                          </p>
                          {c.items.map((item, i) => {
                            const m = meetings.find(
                                (m) => m.id === item.meetingId,
                              ),
                              h = m?.highlights.find(
                                (h) => h.id === item.highlightId,
                              );
                            return (
                              <div className="collection-item" key={item.id}>
                                <button
                                  onClick={() =>
                                    void openMeeting(
                                      item.meetingId,
                                      h?.timestamp || 0,
                                    )
                                  }
                                >
                                  <small>{m?.title}</small>
                                  <p>{h?.text || "Moment unavailable"}</p>
                                  <span className="timestamp">
                                    {h?.timestampFormatted}{" "}
                                    <ArrowUpRight size={12} />
                                  </span>
                                </button>
                                <div>
                                  <button
                                    className="text-button"
                                    disabled={busy}
                                    onClick={() =>
                                      void run(async () => {
                                        await api(
                                          `/playlists/${c.id}/items/${item.id}`,
                                          "DELETE",
                                        );
                                        await loadCollections();
                                      })
                                    }
                                  >
                                    Remove
                                  </button>
                                  <button
                                    className="icon-btn"
                                    disabled={i === 0 || busy}
                                    aria-label={`Move moment ${i + 1} up`}
                                    onClick={() =>
                                      void run(async () => {
                                        const ids = c.items.map((x) => x.id);
                                        [ids[i - 1], ids[i]] = [
                                          ids[i],
                                          ids[i - 1],
                                        ];
                                        await api(
                                          `/playlists/${c.id}`,
                                          "PATCH",
                                          {
                                            itemIds: ids,
                                          },
                                        );
                                        await loadCollections();
                                      })
                                    }
                                  >
                                    <ArrowUp size={14} />
                                  </button>
                                  <button
                                    className="icon-btn"
                                    disabled={i === c.items.length - 1 || busy}
                                    aria-label={`Move moment ${i + 1} down`}
                                    onClick={() =>
                                      void run(async () => {
                                        const ids = c.items.map((x) => x.id);
                                        [ids[i + 1], ids[i]] = [
                                          ids[i],
                                          ids[i + 1],
                                        ];
                                        await api(
                                          `/playlists/${c.id}`,
                                          "PATCH",
                                          {
                                            itemIds: ids,
                                          },
                                        );
                                        await loadCollections();
                                      })
                                    }
                                  >
                                    <ArrowDown size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          <button
                            className="secondary"
                            onClick={() => setAddingTo(c.id)}
                          >
                            <Plus size={15} />
                            Add a moment
                          </button>
                        </section>
                      ))}
                  </div>
                </>
              )}
              {view === "Signals" && (
                <>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">NOTICE THE PATTERNS</p>
                      <h1>Keep an ear out.</h1>
                      <p className="page-description">
                        Follow topics across your team’s conversations. Every
                        match has a source.
                      </p>
                    </div>
                    <button
                      className="primary"
                      onClick={() => {
                        setNewName("");
                        setKeywords("");
                        setEditing(null);
                        setScope([]);
                        setDialog("signal");
                      }}
                    >
                      <Plus size={16} />
                      New signal
                    </button>
                  </div>
                  <div className="signal-controls-bar">
                    <div className="signal-control-item">
                      <span className="control-label">FILTER BY SIGNAL</span>
                      <div className="signal-select-wrap">
                        <Signal size={15} className="control-icon" />
                        <select
                          value={selectedSignal}
                          onChange={(e) => setSelectedSignal(e.target.value)}
                          aria-label="Filter by signal"
                        >
                          <option value="all">All signals ({trackers.length})</option>
                          {trackers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="signal-control-item search-item">
                      <span className="control-label">SEARCH MATCHED EXCERPTS</span>
                      <div className="signal-input-wrap">
                        <Search size={15} className="control-icon" />
                        <input
                          placeholder="Search in excerpts, speakers, topics, or keywords…"
                          value={signalQuery}
                          onChange={(e) => setSignalQuery(e.target.value)}
                          aria-label="Search matched excerpts"
                        />
                        {signalQuery && (
                          <button
                            type="button"
                            className="signal-clear-btn"
                            onClick={() => setSignalQuery("")}
                            aria-label="Clear search query"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="signal-cards-grid">
                    {trackers.map((t) => {
                      const matchCount = matches.filter(
                        (m) => m.trackerId === t.id,
                      ).length;
                      const isSelected = selectedSignal === t.id;
                      return (
                        <div
                          key={t.id}
                          className={`signal-card ${isSelected ? "selected" : ""} ${!t.enabled ? "paused" : ""}`}
                          onClick={() =>
                            setSelectedSignal(isSelected ? "all" : t.id)
                          }
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedSignal(isSelected ? "all" : t.id);
                            }
                          }}
                        >
                          <div className="signal-card-main">
                            <div className="signal-card-header">
                              <div className="signal-icon-mark">
                                <Signal size={16} />
                              </div>
                              <div className="signal-title-wrap">
                                <strong>{t.name}</strong>
                                <div className="signal-meta-line">
                                  <span
                                    className={`signal-status-pill ${t.enabled ? "active" : "paused"}`}
                                  >
                                    <span className="status-dot" />
                                    {t.enabled ? "Tracking" : "Paused"}
                                  </span>
                                  <span className="signal-match-count">
                                    {matchCount}{" "}
                                    {matchCount === 1 ? "match" : "matches"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="signal-keywords-wrap">
                              {t.keywords.map((kw) => (
                                <span key={kw} className="keyword-chip">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div
                            className="signal-card-actions"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className="signal-action-btn"
                              title="Edit signal"
                              aria-label={`Edit ${t.name}`}
                              onClick={() => {
                                setEditing(t.id);
                                setNewName(t.name);
                                setKeywords(t.keywords.join(", "));
                                setScope(
                                  t.meetingScope === "all"
                                    ? []
                                    : t.meetingScope,
                                );
                                setDialog("signal");
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="signal-action-btn"
                              title={t.enabled ? "Pause tracking" : "Resume tracking"}
                              aria-label={`${t.enabled ? "Pause" : "Resume"} ${t.name}`}
                              disabled={busy}
                              onClick={() =>
                                void run(async () => {
                                  await api(`/trackers/${t.id}`, "PATCH", {
                                    enabled: !t.enabled,
                                  });
                                  await loadSignals();
                                })
                              }
                            >
                              {t.enabled ? "Pause" : "Resume"}
                            </button>
                            <button
                              type="button"
                              className="signal-action-btn danger"
                              title="Delete signal"
                              aria-label={`Delete ${t.name}`}
                              disabled={busy}
                              onClick={() =>
                                void run(async () => {
                                  await api(`/trackers/${t.id}`, "DELETE");
                                  await loadSignals();
                                  if (selectedSignal === t.id)
                                    setSelectedSignal("all");
                                })
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="signal-matches-header">
                    <h2>
                      Matched conversations
                      <span className="count-pill">
                        {
                          matches.filter(
                            (m) =>
                              (selectedSignal === "all" ||
                                m.trackerId === selectedSignal) &&
                              (
                                m.excerpt +
                                " " +
                                m.speaker +
                                " " +
                                m.meetingTitle +
                                " " +
                                m.keyword
                              )
                                .toLowerCase()
                                .includes(signalQuery.toLowerCase()),
                          ).length
                        }
                      </span>
                    </h2>
                    {selectedSignal !== "all" && (
                      <button
                        type="button"
                        className="text-button small"
                        onClick={() => setSelectedSignal("all")}
                      >
                        Reset filter to all signals
                      </button>
                    )}
                  </div>

                  <div className="signal-list">
                    {matches
                      .filter(
                        (m) =>
                          (selectedSignal === "all" ||
                            m.trackerId === selectedSignal) &&
                          (
                            m.excerpt +
                            " " +
                            m.speaker +
                            " " +
                            m.meetingTitle +
                            " " +
                            m.keyword
                          )
                            .toLowerCase()
                            .includes(signalQuery.toLowerCase()),
                      )
                      .map((m, i) => (
                        <button
                          key={m.segmentId + ":" + m.trackerId + ":" + i}
                          className="signal-match-card"
                          onClick={() =>
                            void openMeeting(
                              m.meetingId,
                              m.timestamp,
                              "Conversation",
                            )
                          }
                        >
                          <div className="match-card-top">
                            <div className="match-badge-group">
                              <span className="keyword-badge">
                                <Signal size={12} />
                                {m.keyword}
                              </span>
                              <span className="tracker-name-badge">
                                {trackers.find((t) => t.id === m.trackerId)
                                  ?.name || "Signal"}
                              </span>
                            </div>
                            <span className="match-timestamp">
                              {m.timestampFormatted}{" "}
                              <ArrowUpRight size={14} />
                            </span>
                          </div>
                          <blockquote className="match-excerpt">
                            “{m.excerpt}”
                          </blockquote>
                          <div className="match-card-footer">
                            <div className="speaker-info">
                              <span className="speaker-avatar-dot" />
                              <strong>{m.speaker}</strong>
                              <span className="meta-separator">·</span>
                              <span className="meeting-title-label">
                                {m.meetingTitle}
                              </span>
                            </div>
                            <span className="jump-hint">
                              Jump to moment <ArrowRight size={13} />
                            </span>
                          </div>
                        </button>
                      ))}
                  </div>

                  {!matches.some(
                    (m) =>
                      (selectedSignal === "all" ||
                        m.trackerId === selectedSignal) &&
                      `${m.excerpt} ${m.speaker} ${m.meetingTitle} ${m.keyword}`
                        .toLowerCase()
                        .includes(signalQuery.toLowerCase()),
                  ) && (
                    <div className="empty">
                      No matches found{signalQuery ? ` for “${signalQuery}”` : ""}.
                      {selectedSignal !== "all"
                        ? " Try selecting “All signals” or adjusting your search phrase."
                        : " Add a new signal above to follow topics across your sessions."}
                    </div>
                  )}
                </>
              )}
              {view === "Capture studio" && (
                <div className="studio">
                  <UpcomingSessions onCapture={startCall} />
                  <p className="eyebrow">A SPACE TO TRY IT OUT</p>
                  <h1>
                    Start a conversation.
                    <br />
                    Leave with a plan.
                  </h1>
                  <p className="page-description">
                    Run a short, consent-based test session. Relay turns the
                    scenario into a persisted meeting you can search, annotate,
                    and share.
                  </p>
                  <div className="studio-visual">
                    <AudioLines size={90} />
                    <span className="studio-orbit">01 → 02 → 03</span>
                  </div>
                  <button className="primary" onClick={() => startCall()}>
                    <Mic size={18} />
                    Start a test session
                  </button>
                  <div className="studio-steps">
                    <div>
                      <span>01</span>
                      <strong>You’re in control</strong>
                      <p>
                        Approve capture explicitly. Microphone or simulation —
                        your choice.
                      </p>
                    </div>
                    <div>
                      <span>02</span>
                      <strong>Keep working</strong>
                      <p>
                        Minimize the floating recorder and use the rest of the
                        workspace.
                      </p>
                    </div>
                    <div>
                      <span>03</span>
                      <strong>Keep the context</strong>
                      <p>
                        Finish the call. Its notes, actions, and moments are
                        saved to Postgres.
                      </p>
                    </div>
                  </div>
                  <p className="muted small">
                    Scenario-generated notes, not live transcription. Microphone
                    audio stays on this device. No meeting bot joins external
                    calls.
                  </p>
                </div>
              )}
              {(view === "Settings" || view === "Preferences") && (
                <>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">WORKSPACE SETTINGS</p>
                      <h1>Settings & Preferences</h1>
                    </div>
                  </div>
                  <div className="filter-row" style={{ marginBottom: 24 }}>
                    {[
                      { id: "all", label: "All settings" },
                      { id: "preferences", label: "Preferences" },
                      { id: "appearance", label: "Appearance" },
                      { id: "integrations", label: "Integrations" },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        className={settingsTab === id ? "selected" : ""}
                        onClick={() =>
                          setSettingsTab(id as typeof settingsTab)
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {(settingsTab === "all" || settingsTab === "appearance") && (
                    <section className="preference-card" id="appearance">
                      <h2>
                        <Sun size={20} />
                        Appearance & theme
                      </h2>
                      <p>
                        Switch between Relay’s warm editorial light theme, deep
                        forest dark theme, or follow your system preference.
                        Changes apply across the entire workspace immediately.
                      </p>
                      <div style={{ maxWidth: 300, marginTop: 14 }}>
                        <ThemeToggle />
                      </div>
                      <h3 style={{ marginTop: 24, fontSize: 15 }}>
                        Reading & transcript density
                      </h3>
                      <p>
                        Choose how much breathing room the session library and
                        conversation transcript get. This preference is saved in
                        this browser.
                      </p>
                      <div className="button-row">
                        <button
                          type="button"
                          className={!compact ? "primary" : "secondary"}
                          onClick={() => {
                            setCompact(false);
                            try {
                              localStorage.setItem(
                                "relay-density",
                                "comfortable",
                              );
                            } catch {
                              setError(
                                "Your browser could not save this display preference.",
                              );
                            }
                          }}
                        >
                          Comfortable spacing
                        </button>
                        <button
                          type="button"
                          className={compact ? "primary" : "secondary"}
                          onClick={() => {
                            setCompact(true);
                            try {
                              localStorage.setItem("relay-density", "compact");
                            } catch {
                              setError(
                                "Your browser could not save this display preference.",
                              );
                            }
                          }}
                        >
                          Compact spacing
                        </button>
                      </div>
                    </section>
                  )}

                  {(settingsTab === "all" ||
                    settingsTab === "preferences") && (
                    <WorkspacePreferences />
                  )}

                  {(settingsTab === "all" ||
                    settingsTab === "integrations") && (
                    <WorkspaceIntegrations
                      onStartCall={() => startCall()}
                      onViewUpcoming={() => {
                        setLibraryScope("upcoming");
                        navigate("Sessions");
                      }}
                    />
                  )}

                  {settingsTab === "all" && (
                    <section className="preference-card">
                      <h2>
                        <Database size={20} />
                        Connected workspace
                      </h2>
                      <p>
                        Meetings, participants, transcripts, follow-ups,
                        moments, collections, signals and share links live in
                        PostgreSQL. Reloading fetches their saved state from the
                        API.
                      </p>
                      <span className="tag status-connected">
                        <span className="status-dot" />
                        PostgreSQL Connected · Neon Serverless
                      </span>
                      <p className="muted small" style={{ marginTop: 12 }}>
                        Public demo data environment. Calendar integrations and
                        external meeting bots are simulated safely in browser.
                      </p>
                    </section>
                  )}
                </>
              )}
            </>
          )}
        </main>
        <footer className="workspace-footer">
          <span>
            relay. <span>Make the next step count.</span>
          </span>
          <span>Meeting intelligence, thoughtfully connected.</span>
        </footer>
      </div>
      {search && (
        <Dialog title="Find the thread" onClose={() => setSearch(false)} wide>
          <label>
            Result type
            <select
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value);
                setSearchIndex(0);
              }}
            >
              {[
                "all",
                "meeting",
                "transcript",
                "summary",
                "actionItem",
                "highlight",
                "playlist",
                "tracker",
              ].map((v) => (
                <option value={v} key={v}>
                  {
                    {
                      meeting: "Sessions",
                      transcript: "Conversation",
                      summary: "Briefs",
                      actionItem: "Follow-ups",
                      highlight: "Moments",
                      playlist: "Collections",
                      tracker: "Signals",
                      all: "Everything",
                    }[v]
                  }
                </option>
              ))}
            </select>
          </label>
          <label className="global-search-input">
            <Search size={22} />
            <input
              autoFocus
              placeholder="A person, a promise, a passing thought…"
              aria-label="Search workspace"
              onKeyDown={(e) => {
                const filtered = results.filter(
                  (r) => searchType === "all" || r.type === searchType,
                );
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  setSearchIndex((i) =>
                    Math.max(
                      0,
                      Math.min(
                        filtered.length - 1,
                        i + (e.key === "ArrowDown" ? 1 : -1),
                      ),
                    ),
                  );
                }
                if (e.key === "Enter" && filtered[searchIndex]) {
                  e.preventDefault();
                  resultClick(filtered[searchIndex]);
                }
              }}
              maxLength={160}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setResults([]);
                setSearchIndex(0);
              }}
            />
          </label>
          <p className="muted small">
            Search sessions, voices, transcripts, follow-ups, moments,
            collections and signals.
          </p>
          {searchError && <p className="error-text">{searchError}</p>}
          <div className="search-results">
            {searching ? (
              <p role="status">Searching the database…</p>
            ) : !query.trim() ? (
              <div className="empty">
                Try “migration”, “Sarah”, or a moment you saved.
              </div>
            ) : results.some(
                (r) => searchType === "all" || r.type === searchType,
              ) ? (
              results
                .filter((r) => searchType === "all" || r.type === searchType)
                .map((r, i) => (
                  <button
                    key={i}
                    className={searchIndex === i ? "selected" : ""}
                    onClick={() => resultClick(r)}
                  >
                    <span className="tag">
                      {
                        {
                          actionItem: "Follow-up",
                          playlist: "Collection",
                          tracker: "Signal",
                          meeting: "Session",
                          transcript: "Conversation",
                          summary: "Brief",
                          highlight: "Moment",
                        }[r.type]
                      }
                    </span>
                    <h3>{r.title}</h3>
                    <p>{r.snippet}</p>
                    <small>
                      {r.meetingTitle || r.category}{" "}
                      {r.timestampFormatted && `· ${r.timestampFormatted}`}
                    </small>
                    <ArrowUpRight size={17} />
                  </button>
                ))
            ) : (
              <div className="empty">
                No matches for “{query}”. Try a shorter phrase.
              </div>
            )}
          </div>
        </Dialog>
      )}
      {(dialog === "collection" || dialog === "signal") && (
        <Dialog
          title={
            dialog === "collection" ? "Curate a collection" : "Follow a signal"
          }
          onClose={() => setDialog(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                if (dialog === "collection") {
                  await api(
                    editing ? `/playlists/${editing}` : "/playlists",
                    editing ? "PATCH" : "POST",
                    { title: newName, description },
                  );
                  await loadCollections();
                } else {
                  await api(
                    editing ? `/trackers/${editing}` : "/trackers",
                    editing ? "PATCH" : "POST",
                    {
                      meetingScope: scope.length ? scope : "all",
                      name: newName,
                      keywords: keywords
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    },
                  );
                  await loadSignals();
                }
                setDialog(null);
              });
            }}
          >
            <label>
              Name
              <input
                required
                maxLength={120}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={
                  dialog === "collection" ? "Customer voices" : "Launch risks"
                }
              />
            </label>
            {dialog === "collection" && (
              <label>
                Description
                <textarea
                  value={description}
                  maxLength={400}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
            )}
            {dialog === "signal" && (
              <label>
                Session scope (none selected means all)
                <select
                  multiple
                  value={scope}
                  onChange={(e) =>
                    setScope(
                      Array.from(e.target.selectedOptions, (o) => o.value),
                    )
                  }
                >
                  {meetings.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {dialog === "signal" && (
              <label>
                Keywords, separated by commas
                <input
                  required
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="risk, blocker, launch"
                />
              </label>
            )}
            <button className="primary" disabled={busy}>
              {busy ? "Saving…" : editing ? "Save changes" : "Create"}
            </button>
            {error && <p className="error-text">{error}</p>}
          </form>
        </Dialog>
      )}
      {addingTo && (
        <Dialog title="Choose a moment" onClose={() => setAddingTo(null)}>
          <div className="picker-list">
            {meetings.flatMap((m) =>
              m.highlights.map((h) => (
                <button
                  key={h.id}
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await api(`/playlists/${addingTo}/items`, "POST", {
                        highlightId: h.id,
                      });
                      await loadCollections();
                      setAddingTo(null);
                    })
                  }
                >
                  <small>
                    {m.title} · {h.timestampFormatted}
                  </small>
                  <p>{h.text}</p>
                  <Plus size={15} />
                </button>
              )),
            )}
          </div>
        </Dialog>
      )}
      {dialog === "help" && (
        <Dialog
          title="A little context goes a long way"
          onClose={() => setDialog(null)}
        >
          <RelayHelp
            onCapture={() => {
              setDialog(null);
              startCall();
            }}
          />
        </Dialog>
      )}
      {reel && (
        <CollectionReel
          list={reel}
          meetings={meetings}
          onClose={() => setReel(null)}
          onOpen={(id, time) => void openMeeting(id, time)}
        />
      )}
      {capture.persistenceFailed && (
        <p className="notice error" role="alert">
          This browser could not save capture recovery state. Keep this page
          open until the session is saved.
        </p>
      )}
      {captureVisible && capture.engine && (
        <TestCallPanel
          initialTitle={captureTitle}
          state={capture.state}
          engine={capture.engine}
          minimized={minimized}
          onMinimize={() => setMinimized(true)}
          onRestore={() => setMinimized(false)}
          onClose={() => {
            capture.engine?.cancel();
            setCaptureVisible(false);
          }}
          onOpenMeeting={(id) => {
            setCaptureVisible(false);
            void openMeeting(id);
            void load();
          }}
        />
      )}
      {!captureVisible &&
        ["recording", "processing", "interrupted"].includes(
          capture.state.phase,
        ) && (
          <button
            className="capture-return"
            onClick={() => {
              setCaptureVisible(true);
              setMinimized(false);
            }}
          >
            <Radio size={16} />
            {capture.state.phase === "recording"
              ? `Recording ${formatTime(capture.state.elapsed)}`
              : "Resume test session"}
          </button>
        )}
    </div>
  );
}
