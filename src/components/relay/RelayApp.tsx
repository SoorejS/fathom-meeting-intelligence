"use client";
import { useState, useEffect, useCallback } from "react";
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
import { formatTime } from "@/lib/testCallMeeting";

type Collection = {
  id: string;
  title: string;
  description: string;
  items: {
    id: string;
    highlightId: string;
    meetingId: string;
    order: number;
  }[];
};
const sections = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Sessions", icon: AudioLines },
  { name: "Action desk", icon: CheckCircle2 },
  { name: "Collections", icon: Folder },
  { name: "Signals", icon: Signal },
  { name: "Capture studio", icon: Mic },
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
  const openMeeting = useCallback(async (id: string, time = 0) => {
    setBusy(true);
    try {
      const m = await api<Meeting>(`/meetings/${id}`);
      setSelected(m);
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
  }, []);
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
            const n = Number(u.searchParams.get("t"));
            setSelectedTime(Number.isFinite(n) ? n : 0);
          })
          .catch((e) => setError(e.message));
      else setSelected(null);
    };
    const id = new URL(location.href).searchParams.get("meeting");
    if (id)
      api<Meeting>(`/meetings/${encodeURIComponent(id)}`)
        .then((m) => {
          setSelected(m);
          const n = Number(new URL(location.href).searchParams.get("t"));
          setSelectedTime(Number.isFinite(n) ? n : 0);
        })
        .catch((e) => setError(e.message));
    window.addEventListener("relay:meetings", load);
    window.addEventListener("popstate", restore);
    return () => {
      window.removeEventListener("relay:meetings", load);
      window.removeEventListener("popstate", restore);
    };
  }, [load]);
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
  function startCall() {
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
  const visible = meetings.filter(
    (m) =>
      (filter === "All" || m.category === filter) &&
      (m.title + " " + m.participants.map((p) => p.name).join(" "))
        .toLowerCase()
        .includes(libraryQuery.toLowerCase()),
  );
  const resultClick = (r: SearchResult) => {
    if (r.meetingId) void openMeeting(r.meetingId, r.timestamp || 0);
    else {
      setSearch(false);
      navigate(r.type === "playlist" ? "Collections" : "Signals");
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
          {sections.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={!selected && view === name ? "active" : ""}
              onClick={() => navigate(name)}
            >
              <Icon size={18} />
              {name}
              {name === "Action desk" && openActions.length > 0 && (
                <span>{openActions.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="nav-bottom">
          <div className="nav-note">
            <span className="status-dot" />
            Built for the follow-through.
            <p>
              Less rewatching.
              <br />
              More moving forward.
            </p>
          </div>
          <div className="nav-theme-wrap">
            <ThemeToggle />
          </div>
          <button onClick={() => navigate("Preferences")}>
            <Settings2 size={17} />
            Preferences
          </button>
          <button onClick={() => setDialog("help")}>
            <CircleHelp size={17} />A quick guide
          </button>
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
            <strong>{selected ? "Session" : view}</strong>
          </div>
          <div>
            <span className="connection">
              <span className={`status-dot ${error ? "offline" : ""}`} />
              {loading
                ? "Connecting"
                : error
                  ? "Connection issue"
                  : busy ? "Working…" : "Database connected"}
            </span>
            <button className="primary" onClick={startCall}>
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
                  <div className="section-title library-title">
                    <div>
                      <h2>
                        {view === "Overview"
                          ? "The conversation shelf"
                          : "Session library"}
                      </h2>
                      <p className="muted small">
                        {meetings.length} sessions · newest first
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
                    {visible.map((m, i) => (
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
                                m.actionItems.filter((a) => a.status === "open")
                                  .length
                              }{" "}
                              next steps <ArrowUpRight size={15} />
                            </span>
                          </div>
                        </div>
                      </button>
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
                    {actions.map((a) => (
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
                        setDialog("collection");
                      }}
                    >
                      <Plus size={16} />
                      New collection
                    </button>
                  </div>
                  <div className="collection-grid">
                    {collections.map((c) => (
                      <section className="collection-card" key={c.id}>
                        <Folder size={24} />
                        <h2>{c.title}</h2>
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
                                      await api(`/playlists/${c.id}`, "PATCH", {
                                        itemIds: ids,
                                      });
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
                                      await api(`/playlists/${c.id}`, "PATCH", {
                                        itemIds: ids,
                                      });
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
                        setDialog("signal");
                      }}
                    >
                      <Plus size={16} />
                      New signal
                    </button>
                  </div>
                  <div className="signal-tags">
                    {trackers.map((t) => (
                      <div key={t.id}>
                        <Signal size={18} />
                        <strong>{t.name}</strong>
                        <span>{t.keywords.join(" · ")}</span>
                        <button
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
                      </div>
                    ))}
                  </div>
                  <div className="signal-list">
                    {matches.map((m, i) => (
                      <button
                        key={m.segmentId + ":" + m.trackerId + ":" + i}
                        onClick={() =>
                          void openMeeting(m.meetingId, m.timestamp)
                        }
                      >
                        <span className="tag">{m.keyword}</span>
                        <p>{m.excerpt}</p>
                        <small>
                          {m.speaker} · {m.meetingTitle}
                        </small>
                        <span className="timestamp">
                          {m.timestampFormatted} <ArrowUpRight size={14} />
                        </span>
                      </button>
                    ))}
                  </div>
                  {!matches.length && (
                    <div className="empty">
                      No matches yet. Add a signal with a topic your team
                      discusses.
                    </div>
                  )}
                </>
              )}
              {view === "Capture studio" && (
                <div className="studio">
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
                  <button className="primary" onClick={startCall}>
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
              {view === "Preferences" && (
                <>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">MAKE ROOM FOR YOUR WORK</p>
                      <h1>Your workspace, your pace.</h1>
                    </div>
                  </div>
                  <section className="preference-card">
                    <h2>
                      <Sun size={20} />
                      Appearance & theme
                    </h2>
                    <p>
                      Switch between Relay’s warm editorial light theme, deep forest dark theme, or follow your system preference. Changes apply across the entire workspace immediately.
                    </p>
                    <div style={{ maxWidth: 300, marginTop: 14 }}>
                      <ThemeToggle />
                    </div>
                  </section>
                  <section className="preference-card">
                    <h2>Reading density</h2>
                    <p>
                      Choose how much breathing room the session library gets.
                      This preference is stored only in this browser.
                    </p>
                    <button
                      className="secondary"
                      onClick={() => {
                        const next = !compact;
                        setCompact(next);
                        try {
                          localStorage.setItem(
                            "relay-density",
                            next ? "compact" : "comfortable",
                          );
                        } catch {
                          setError(
                            "Your browser could not save this display preference.",
                          );
                        }
                      }}
                    >
                      {compact
                        ? "Use comfortable spacing"
                        : "Use compact spacing"}
                    </button>
                  </section>
                  <section className="preference-card">
                    <h2>
                      <Database size={20} />
                      Connected workspace
                    </h2>
                    <p>
                      Meetings, participants, transcripts, follow-ups, moments,
                      collections, signals and share links live in PostgreSQL.
                      Reloading fetches their saved state from the API.
                    </p>
                    <span className="tag">
                      Public demo · fictional example data
                    </span>
                    <p className="muted small">
                      This demo has no private accounts. Do not enter
                      confidential information. Calendar integrations and
                      external meeting bots are outside this release.
                    </p>
                  </section>
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
          <label className="global-search-input">
            <Search size={22} />
            <input
              autoFocus
              placeholder="A person, a promise, a passing thought…"
              aria-label="Search workspace"
              maxLength={160}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setResults([]);
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
            ) : results.length ? (
              results.map((r, i) => (
                <button key={i} onClick={() => resultClick(r)}>
                  <span className="tag">
                    {r.type === "actionItem" ? "Follow-up" : r.type}
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
                  await api("/playlists", "POST", { title: newName });
                  await loadCollections();
                } else {
                  await api("/trackers", "POST", {
                    name: newName,
                    keywords: keywords
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  });
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
              {busy ? "Saving…" : "Create"}
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
          <div className="guide">
            <h3>Start with a session</h3>
            <p>
              Open a card on the shelf. The Brief captures decisions;
              Conversation connects them to the words that were said.
            </p>
            <h3>Move from listening to doing</h3>
            <p>
              Complete follow-ups, save a moment from the transcript, and curate
              collections. Changes are saved to the shared database.
            </p>
            <h3>Find it. Pass it on.</h3>
            <p>
              Search with Ctrl/⌘ K. Create a share link for a read-only view on
              another device.
            </p>
            <h3>Try the capture loop</h3>
            <p>
              New session runs a consent-based scenario. The floating recorder
              stays with you while you work. Notes are simulated; database
              persistence is real.
            </p>
          </div>
        </Dialog>
      )}
      {captureVisible && capture.engine && (
        <TestCallPanel
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
