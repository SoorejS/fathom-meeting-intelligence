"use client";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Link2,
  Pause,
  Play,
  Plus,
  Search,
  Send,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type {
  Meeting,
  Highlight,
  ActionItem,
  TranscriptSegment,
  SummaryTemplateKey,
} from "@/types/meeting";
import type { MeetingAnswer } from "@/lib/meetingAnswers";
import { api } from "@/lib/api";
import { formatTime } from "@/lib/testCallMeeting";
import { useLocalAudio } from "@/lib/useLocalAudio";
import {
  defaultPreferences,
  type RelayPreferences,
} from "@/lib/relayPreferences";
import { Dialog } from "./Dialog";

export function MeetingPane({
  initial,
  onBack,
  onChanged,
  readOnly = false,
  initialTime = 0,
  initialTab = "Brief",
}: {
  initial: Meeting;
  onBack?(): void;
  onChanged?(): void;
  readOnly?: boolean;
  initialTime?: number;
  initialTab?: string;
}) {
  const [meeting, setMeeting] = useState(initial),
    [tab, setTab] = useState(initialTab),
    [time, setTime] = useState(initialTime),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [template, setTemplate] = useState<SummaryTemplateKey>(
      initial.template || "default",
    );
  const [notice, setNotice] = useState("");
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [transcriptQuery, setTranscriptQuery] = useState("");
  const [highlight, setHighlight] = useState<{
      id?: string;
      text: string;
      type: string;
      timestamp: number;
    } | null>(null),
    [action, setAction] = useState(false),
    [actionText, setActionText] = useState("");
  const [share, setShare] = useState(false),
    [includeTime, setIncludeTime] = useState(true),
    [shareUrl, setShareUrl] = useState(""),
    [copied, setCopied] = useState(false);
  const [question, setQuestion] = useState(""),
    [answer, setAnswer] = useState<MeetingAnswer | null>(null),
    [asking, setAsking] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const [prefs, setPrefs] = useState<RelayPreferences>(defaultPreferences);
  const [actionOwner, setActionOwner] = useState(
      initial.participants[0]?.name || "Team",
    ),
    [dueDate, setDueDate] = useState("");
  const [actionFilter, setActionFilter] = useState("all"),
    [momentFilter, setMomentFilter] = useState("All");
  const [addingMoment, setAddingMoment] = useState<string | null>(null),
    [lists, setLists] = useState<{ id: string; title: string }[]>([]);
  const [muted, setMuted] = useState(false),
    [audioFailed, setAudioFailed] = useState(false);
  const activeLine = useRef<HTMLElement>(null),
    player = useRef<HTMLDivElement>(null);
  const activeId = [...meeting.transcript]
    .reverse()
    .find((t) => t.timestamp <= time)?.id;
  useEffect(() => {
    if (!readOnly)
      api<RelayPreferences>("/preferences")
        .then((p) => {
          setPrefs(p);
          if (!initial.template && p.defaultTemplate) {
            setTemplate(p.defaultTemplate);
          }
        })
        .catch((e) => setError(e.message));
  }, [readOnly, initial.template]);
  useEffect(() => {
    if (tab === "Conversation" && !transcriptQuery)
      activeLine.current?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
  }, [activeId, tab, transcriptQuery]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).closest(
          "input,textarea,select,button,a,[contenteditable],dialog",
        )
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((v) => !v);
      }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const n = Math.max(
          0,
          Math.min(
            meeting.duration,
            time + (e.key === "ArrowRight" ? 10 : -10),
          ),
        );
        setTime(n);
        if (audio.current) audio.current.currentTime = n;
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [time, meeting.duration]);
  async function chooseTemplate(value: SummaryTemplateKey) {
    if (readOnly) {
      setTemplate(value);
      return;
    }
    await mutate(
      `/meetings/${meeting.id}/preferences`,
      "PATCH",
      { template: value },
      () => setTemplate(value),
    );
  }
  const localAudio = useLocalAudio(
    meeting.id,
    !!meeting.testCall?.hasLocalAudio,
  );
  const completed = meeting.actionItems.filter(
    (a) => a.status === "completed",
  ).length;
  useEffect(() => {
    if (!playing || (localAudio.url && !audioFailed)) return;
    const interval = setInterval(
      () =>
        setTime((t) => {
          const next = Math.min(meeting.duration, t + speed);
          if (next >= meeting.duration) setPlaying(false);
          return next;
        }),
      1000,
    );
    return () => clearInterval(interval);
  }, [playing, speed, meeting.duration, localAudio.url, audioFailed]);
  useEffect(() => {
    if (!audio.current || audioFailed) return;
    audio.current.playbackRate = speed;
    audio.current.muted = muted;
    if (playing)
      audio.current.play().catch(() => {
        setPlaying(false);
        setError(
          "Audio could not start. Try Play again or download your recording.",
        );
      });
    else audio.current.pause();
  }, [playing, speed, muted, audioFailed, localAudio.url]);
  const seek = (n: number) => {
    const bounded = Math.max(0, Math.min(meeting.duration, n));
    setTime(bounded);
    if (audio.current) audio.current.currentTime = bounded;
  };
  async function refresh() {
    const next = await api<Meeting>(`/meetings/${meeting.id}`);
    setMeeting(next);
    onChanged?.();
  }
  async function mutate(
    path: string,
    method: string,
    data: unknown,
    done?: () => void,
  ) {
    setBusy(true);
    setError("");
    try {
      await api(path, method, data);
      await refresh();
      done?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function changeTab(next: string) {
    setTab(next);
    if (readOnly) return;
    try {
      if (next === "Conversation") {
        const transcript = await api<TranscriptSegment[]>(
          `/meetings/${meeting.id}/transcript`,
        );
        setMeeting((m) => ({ ...m, transcript }));
      }
      if (next === "Follow-through") {
        const actionItems = await api<ActionItem[]>(
          `/meetings/${meeting.id}/action-items`,
        );
        setMeeting((m) => ({ ...m, actionItems }));
      }
      if (next === "Moments") {
        const highlights = await api<Highlight[]>(
          `/meetings/${meeting.id}/highlights`,
        );
        setMeeting((m) => ({ ...m, highlights }));
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function ask(q: string) {
    if (!q.trim()) return;
    setQuestion(q);
    setAsking(true);
    setError("");
    try {
      setAnswer(
        await api<MeetingAnswer>(`/meetings/${meeting.id}/ask`, "POST", {
          question: q,
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAsking(false);
    }
  }
  async function createShare() {
    setBusy(true);
    setError("");
    try {
      const result = await api<{ path: string }>("/shares", "POST", {
        meetingId: meeting.id,
        timestamp: includeTime ? Math.floor(time) : 0,
      });
      setShareUrl(location.origin + result.path);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const summary = meeting.summary[template] || meeting.summary.default;
  return (
    <section className="meeting-pane">
      <div className="breadcrumb">
        {onBack && (
          <button onClick={onBack}>
            <ArrowLeft size={15} />
            Session library
          </button>
        )}
        <span>
          {readOnly ? "SHARED SESSION" : meeting.category.toUpperCase()}
        </span>
      </div>
      <div className="meeting-heading">
        <div>
          <p className="eyebrow">
            {meeting.dateFormatted} <span>·</span> {meeting.durationFormatted}{" "}
            <span>·</span> {meeting.participants.length} voices
          </p>
          <h1>{meeting.title}</h1>
        </div>
        {!readOnly && (
          <button className="primary" onClick={() => setShare(true)}>
            <Link2 size={16} />
            Share session
          </button>
        )}
      </div>
      <div className="people-line">
        <Users size={16} />
        {meeting.participants.map((p) => p.name).join(" · ")}
      </div>
      <details className="preference-card">
        <summary>Session context & participants</summary>
        <p>Owner: {meeting.owner || meeting.participants[0]?.name}</p>
        {meeting.participants.map((p) => (
          <p key={p.id}>
            {p.name} · {p.role}
            {p.company ? ` · ${p.company}` : ""}
          </p>
        ))}
        {!readOnly && (
          <button
            className="secondary"
            disabled={busy}
            onClick={() =>
              void mutate(`/meetings/${meeting.id}/preferences`, "PATCH", {
                visibility: meeting.visibility === "team" ? "personal" : "team",
              })
            }
          >
            {meeting.visibility === "team"
              ? "Move to personal sessions"
              : "Show in team sessions"}
          </button>
        )}
        <p className="muted small">
          Library visibility is organizational only in this shared demo, not an
          access restriction.
        </p>
      </details>
      {error && (
        <div className="notice error" role="alert">
          {error}
          <button onClick={() => setError("")} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <div className="listening-bar" ref={player}>
        <button
          className="play-round"
          aria-label={playing ? "Pause playback" : "Play playback"}
          onClick={() => {
            if (time >= meeting.duration) seek(0);
            setPlaying(!playing);
          }}
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <div className="play-track">
          <div>
            <strong>
              {localAudio.url ? "Local audio" : "Conversation timeline"}
            </strong>
            <span>
              {formatTime(time)} / {meeting.durationFormatted}
            </span>
          </div>
          <input
            type="range"
            aria-label="Playback position"
            min={0}
            max={meeting.duration}
            step={1}
            value={time}
            onChange={(e) => seek(Number(e.target.value))}
          />
        </div>
        <button
          className="speed"
          aria-label="Playback speed"
          onClick={() =>
            setSpeed(
              [1, 1.25, 1.5, 2][([1, 1.25, 1.5, 2].indexOf(speed) + 1) % 4],
            )
          }
        >
          {speed}×
        </button>
        <span className="playback-note">
          {localAudio.url ? "Browser recording" : "Simulated playback"}
        </span>
        {localAudio.url && (
          <audio
            ref={audio}
            src={localAudio.url}
            onTimeUpdate={() => setTime(audio.current?.currentTime || 0)}
            onLoadedMetadata={() => {
              if (audio.current) audio.current.currentTime = time;
            }}
            onError={() => {
              setAudioFailed(true);
              setPlaying(false);
              setError(
                "Audio is unavailable. The conversation timeline is still usable.",
              );
            }}
            onEnded={() => setPlaying(false)}
          />
        )}
      </div>
      <div className="button-row playback-tools">
        <button className="secondary" onClick={() => seek(time - 10)}>
          −10 seconds
        </button>
        <button className="secondary" onClick={() => seek(time + 10)}>
          +10 seconds
        </button>
        <button
          className="secondary"
          aria-pressed={muted}
          onClick={() => setMuted(!muted)}
        >
          {muted ? "Unmute" : "Mute"}
        </button>
        <button
          className="secondary"
          onClick={() => {
            if (document.fullscreenElement) void document.exitFullscreen();
            else
              void player.current
                ?.requestFullscreen()
                .catch(() =>
                  setError("Fullscreen is unavailable in this browser."),
                );
          }}
        >
          Fullscreen
        </button>
        {localAudio.url && (
          <a
            className="secondary"
            href={localAudio.url}
            download="relay-session-audio"
          >
            Download local audio
          </a>
        )}
      </div>
      <div className="moment-markers" aria-label="Timeline moments">
        {meeting.highlights.map((h) => (
          <button
            className="citation"
            key={h.id}
            onClick={() => seek(h.timestamp)}
          >
            {h.timestampFormatted} · {h.type}
          </button>
        ))}
      </div>
      <div className="meeting-grid">
        <div className="meeting-main">
          <nav className="detail-tabs" aria-label="Session sections">
            {["Brief", "Conversation", "Follow-through", "Moments"].map((t) => (
              <button
                key={t}
                aria-current={tab === t ? "page" : undefined}
                onClick={() => void changeTab(t)}
              >
                {t}
                {t === "Follow-through" && (
                  <span>
                    {
                      meeting.actionItems.filter((a) => a.status === "open")
                        .length
                    }
                  </span>
                )}
              </button>
            ))}
          </nav>
          {tab === "Brief" && (
            <div className="brief">
              <div className="section-title">
                <span className="eyebrow">THE TAKEAWAY</span>
                <select
                  aria-label="Summary template"
                  value={template}
                  onChange={(e) =>
                    void chooseTemplate(e.target.value as SummaryTemplateKey)
                  }
                >
                  <option value="default">Full picture</option>
                  <option value="executive">Executive lens</option>
                  <option value="sales">Customer lens</option>
                  <option value="engineering">Engineering lens</option>
                </select>
              </div>
              <div className="button-row">
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => void chooseTemplate(prefs.defaultTemplate || "default")}
                >
                  Apply default brief ({prefs.defaultTemplate || "default"})
                </button>
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => void chooseTemplate("default")}
                >
                  Reset brief
                </button>
                <button
                  className="text-button"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(
                        [
                          summary.title,
                          summary.overview,
                          ...summary.keyPoints,
                          "Decisions",
                          ...summary.decisions,
                          "Next steps",
                          ...summary.nextSteps,
                        ].join("\n"),
                      )
                      .then(() => setNotice("Brief copied."))
                      .catch(() =>
                        setError(
                          "Clipboard unavailable. Select and copy the brief text.",
                        ),
                      );
                  }}
                >
                  Copy brief
                </button>
              </div>
              <p className="overview">{summary.overview}</p>
              <div className="decision-box">
                <div className="section-title">
                  <h2>
                    <CheckCircle2 size={20} />
                    What we decided
                  </h2>
                  <span>{summary.decisions.length}</span>
                </div>
                {summary.decisions.length ? (
                  summary.decisions.map((d, i) => (
                    <p key={i}>
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      {d}
                    </p>
                  ))
                ) : (
                  <p>No decisions recorded in this session.</p>
                )}
              </div>
              <h2 className="subheading">The important details</h2>
              <ul className="key-points">
                {summary.keyPoints.map((k, i) => (
                  <li key={i}>{k}</li>
                ))}
              </ul>
              <h2 className="subheading">Next steps</h2>
              {summary.nextSteps.length ? <ul className="key-points">{summary.nextSteps.map((step,i)=><li key={i}>{step}</li>)}</ul> : <p>No next steps recorded in this brief.</p>}
              <button
                className="text-button"
                onClick={() => void changeTab("Follow-through")}
              >
                Turn the conversation into progress <ChevronRight size={16} />
              </button>
            </div>
          )}
          {tab === "Conversation" && (
            <div className="conversation">
              <div className="button-row" style={{ marginBottom: 12 }}>
                <button
                  className="text-button"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(
                        meeting.transcript
                          .map(
                            (t) =>
                              `${t.timestampFormatted} ${t.speaker}: ${t.text}`,
                          )
                          .join("\n"),
                      )
                      .then(() => setNotice("Conversation copied."))
                      .catch(() =>
                        setError(
                          "Clipboard unavailable. Select and copy the conversation text.",
                        ),
                      );
                  }}
                >
                  Copy conversation
                </button>
                {!readOnly && (
                  <button
                    className="text-button"
                    onClick={async () => {
                      const next = !(prefs.showTimestamps !== false);
                      setPrefs((p) => ({ ...p, showTimestamps: next }));
                      try {
                        await api<RelayPreferences>("/preferences", "PATCH", {
                          showTimestamps: next,
                        });
                      } catch {}
                    }}
                  >
                    {prefs.showTimestamps !== false
                      ? "Hide timestamps"
                      : "Show timestamps"}
                  </button>
                )}
              </div>
              <label className="inline-search">
                <Search size={16} />
                <input
                  placeholder="Find in this conversation…"
                  value={transcriptQuery}
                  onChange={(e) => setTranscriptQuery(e.target.value)}
                  aria-label="Filter transcript"
                />
              </label>
              <p className="muted small">
                Selected transcript excerpts · choose a time to navigate
              </p>
              {!meeting.transcript.some((t) =>
                `${t.text} ${t.speaker}`
                  .toLowerCase()
                  .includes(transcriptQuery.toLowerCase()),
              ) && (
                <p className="empty">
                  No conversation excerpts match this search.
                </p>
              )}
              {meeting.transcript
                .filter((t) =>
                  (t.text + " " + t.speaker)
                    .toLowerCase()
                    .includes(transcriptQuery.toLowerCase()),
                )
                .map((t, i) => (
                  <article
                    key={t.id}
                    ref={t.id === activeId ? activeLine : null}
                    aria-current={t.id === activeId ? "true" : undefined}
                    className={`transcript-line ${time >= t.timestamp && time < (meeting.transcript.find((s) => s.timestamp > t.timestamp)?.timestamp ?? meeting.duration + 1) ? "current" : ""}`}
                  >
                    {prefs.showTimestamps !== false && (
                      <button
                        className="timestamp"
                        onClick={() => seek(t.timestamp)}
                      >
                        {t.timestampFormatted}
                      </button>
                    )}
                    <div>
                      <strong>
                        <span className={`speaker-dot tone-${i % 4}`} />
                        {t.speaker}
                      </strong>
                      <p>{t.text}</p>
                      {!readOnly && (
                        <button
                          className="text-button small"
                          onClick={() =>
                            setHighlight({
                              text: t.text,
                              type: prefs.momentTypes[0].name,
                              timestamp: t.timestamp,
                            })
                          }
                        >
                          <Bookmark size={13} />
                          Save a moment
                        </button>
                      )}
                    </div>
                  </article>
                ))}
            </div>
          )}
          {tab === "Follow-through" && (
            <div className="actions-pane">
              <div className="section-title">
                <h2>
                  {completed} of {meeting.actionItems.length} complete
                </h2>
                {!readOnly && (
                  <button className="secondary" onClick={() => setAction(true)}>
                    <Plus size={15} />
                    Add action
                  </button>
                )}
              </div>
              {meeting.actionItems.length === 0 && (
                <div className="empty">
                  No follow-ups recorded yet. Add the next step from this
                  conversation.
                </div>
              )}
              <label>
                Show follow-ups
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                >
                  {["all", "open", "completed"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              {meeting.actionItems
                .filter(
                  (a) => actionFilter === "all" || a.status === actionFilter,
                )
                .map((a) => (
                  <article
                    key={a.id}
                    className={`action-row ${a.status === "completed" ? "done" : ""}`}
                  >
                    <button
                      disabled={readOnly || busy}
                      role="checkbox"
                      aria-checked={a.status === "completed"}
                      aria-label={`Complete ${a.text}`}
                      className="check-control"
                      onClick={() =>
                        void mutate(`/action-items/${a.id}`, "PATCH", {
                          status: a.status === "open" ? "completed" : "open",
                        })
                      }
                    >
                      {a.status === "completed" && <Check size={16} />}
                    </button>
                    <div>
                      <p>{a.text}</p>
                      <small>
                        {a.owner}
                        {a.dueDate && ` · ${a.dueDate}`}
                      </small>
                    </div>
                    <button
                      className="timestamp"
                      onClick={() => seek(a.sourceTimestamp)}
                    >
                      {a.sourceTimestampFormatted}
                    </button>
                  </article>
                ))}
            </div>
          )}
          {tab === "Moments" && (
            <div className="moments-pane">
              <div className="section-title">
                <h2>Keep what matters</h2>
                <span className="muted small">
                  {meeting.highlights.length} saved
                </span>
              </div>
              {!meeting.highlights.length && (
                <div className="empty">
                  Save a moment from the Conversation tab.
                </div>
              )}
              <label>
                Moment category
                <select
                  value={momentFilter}
                  onChange={(e) => setMomentFilter(e.target.value)}
                >
                  {[
                    "All",
                    ...new Set(meeting.highlights.map((h) => h.type)),
                  ].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              {meeting.highlights
                .filter(
                  (h) => momentFilter === "All" || h.type === momentFilter,
                )
                .map((h) => (
                  <article className="moment-card" key={h.id}>
                    <div>
                      <span
                        className="tag"
                        style={{
                          borderLeft: `3px solid ${prefs.momentTypes.find((t) => t.name === h.type)?.color || "var(--green)"}`,
                        }}
                      >
                        {h.type}
                      </span>
                      <button
                        className="timestamp"
                        onClick={() => seek(h.timestamp)}
                      >
                        {h.timestampFormatted}
                      </button>
                    </div>
                    <p>{h.text}</p>
                    <footer>
                      <small>{h.creator}</small>
                      {!readOnly && (
                        <button
                          className="text-button small"
                          onClick={() =>
                            setHighlight({
                              id: h.id,
                              text: h.text,
                              type: h.type,
                              timestamp: h.timestamp,
                            })
                          }
                        >
                          Edit moment <ArrowUpRight size={13} />
                        </button>
                      )}
                      {!readOnly && (
                        <div className="button-row">
                          <button
                            className="text-button"
                            disabled={busy}
                            onClick={() =>
                              void mutate(
                                `/highlights/${h.id}`,
                                "DELETE",
                                undefined,
                              )
                            }
                          >
                            Delete moment
                          </button>
                          <button
                            className="text-button"
                            onClick={() => {
                              setAddingMoment(h.id);
                              void api<{ id: string; title: string }[]>(
                                "/playlists",
                              )
                                .then(setLists)
                                .catch((e) => setError(e.message));
                            }}
                          >
                            Add to collection
                          </button>
                        </div>
                      )}
                    </footer>
                  </article>
                ))}
            </div>
          )}
        </div>
        <aside className="context-rail">
          <div className="outcome-card">
            <span className="eyebrow">FOLLOW-THROUGH</span>
            <div>
              <strong>{meeting.actionItems.length - completed}</strong>
              <span>open actions</span>
            </div>
            <progress
              value={completed}
              max={Math.max(1, meeting.actionItems.length)}
            />
            <p>{completed} completed. Keep the momentum going.</p>
            <button
              className="text-button"
              onClick={() => void changeTab("Follow-through")}
            >
              Review next steps <ArrowUpRight size={15} />
            </button>
          </div>
          {!readOnly && (
            <div className="ask-card">
              <div className="section-title">
                <h2>
                  <Sparkles size={18} />
                  Ask this session
                </h2>
              </div>
              <p className="muted small">
                Answers extracted from this session’s database records, with
                sources.
              </p>
              <div className="question-chips">
                {[
                  "What decisions were made?",
                  "Who owns the action items?",
                  "What risks were raised?",
                ].map((q) => (
                  <button key={q} disabled={asking} onClick={() => void ask(q)}>
                    {q}
                  </button>
                ))}
              </div>
              {answer && (
                <div
                  className={`answer ${answer.citations.length === 0 ? "answer-nomatch" : ""}`}
                  role="status"
                >
                  <p>{answer.answer}</p>
                  {answer.citations.length === 0 && (
                    <p className="muted small" style={{ marginTop: 6, fontStyle: "italic" }}>
                      No transcript evidence found. Try a specific person, decision, or action item.
                    </p>
                  )}
                  {answer.citations.map((c, i) => (
                    <button
                      className="citation"
                      key={i}
                      onClick={() => {
                        seek(c.timestamp);
                        setTab("Conversation");
                      }}
                    >
                      {c.formatted} <ArrowUpRight size={12} />
                    </button>
                  ))}
                </div>
              )}
              <form
                className="ask-input"
                onSubmit={(e) => {
                  e.preventDefault();
                  void ask(question);
                }}
              >
                <input
                  aria-label="Ask this session"
                  placeholder="Ask a question…"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
                <button
                  aria-label="Send question"
                  disabled={asking || !question.trim()}
                >
                  <Send size={16} />
                </button>
              </form>
              {asking && (
                <span className="small muted" role="status">
                  Finding supporting notes…
                </span>
              )}
            </div>
          )}
          <p className="rail-footnote">
            {readOnly
              ? "A live, read-only view of this shared session."
              : "Shared demo workspace · changes are saved to Postgres."}
          </p>
        </aside>
      </div>
      {highlight && (
        <Dialog
          title={highlight.id ? "Edit moment" : "Save a moment"}
          onClose={() => setHighlight(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void mutate(
                highlight.id
                  ? `/highlights/${highlight.id}`
                  : `/meetings/${meeting.id}/highlights`,
                highlight.id ? "PATCH" : "POST",
                highlight,
                () => setHighlight(null),
              );
            }}
          >
            <p className="muted">
              At {formatTime(highlight.timestamp)} in {meeting.title}
            </p>
            <label>
              Label
              <input
                list="moment-labels"
                required
                maxLength={80}
                value={highlight.type}
                onChange={(e) =>
                  setHighlight({ ...highlight, type: e.target.value })
                }
              />
            </label>
            <label>
              <datalist id="moment-labels">
                {prefs.momentTypes.map((t) => (
                  <option key={t.name} value={t.name} />
                ))}
              </datalist>
              Your moment
              <textarea
                required
                maxLength={2000}
                rows={5}
                value={highlight.text}
                onChange={(e) =>
                  setHighlight({ ...highlight, text: e.target.value })
                }
              />
            </label>
            <button className="primary" disabled={busy}>
              {busy ? "Saving…" : "Save to session"}
            </button>
            {error && (
              <p className="error-text" role="alert">
                {error}
              </p>
            )}
          </form>
        </Dialog>
      )}
      {action && (
        <Dialog title="Add a follow-up" onClose={() => setAction(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void mutate(
                `/meetings/${meeting.id}/action-items`,
                "POST",
                {
                  text: actionText,
                  owner: actionOwner,
                  dueDate,
                  sourceTimestamp: Math.floor(time),
                },
                () => {
                  setAction(false);
                  setActionText("");
                },
              );
            }}
          >
            <label>
              What needs to happen?
              <textarea
                required
                maxLength={2000}
                value={actionText}
                onChange={(e) => setActionText(e.target.value)}
              />
            </label>
            <label>
              Owner
              <input
                required
                value={actionOwner}
                onChange={(e) => setActionOwner(e.target.value)}
                list="session-people"
                maxLength={120}
              />
              <datalist id="session-people">
                {meeting.participants.map((p) => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
            </label>
            <label>
              Due date
              <input
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                maxLength={100}
                placeholder="Friday, 5:00 PM"
              />
            </label>
            <p className="muted small">
              Assigned to {actionOwner} · linked to {formatTime(time)}
            </p>
            <button className="primary" disabled={busy}>
              {busy ? "Saving…" : "Save action"}
            </button>
            {error && (
              <p className="error-text" role="alert">
                {error}
              </p>
            )}
          </form>
        </Dialog>
      )}
      {addingMoment && (
        <Dialog
          title="Add moment to collection"
          onClose={() => setAddingMoment(null)}
        >
          {lists.length ? (
            lists.map((c) => (
              <button
                className="secondary"
                key={c.id}
                disabled={busy}
                onClick={() =>
                  void mutate(
                    `/playlists/${c.id}/items`,
                    "POST",
                    { highlightId: addingMoment },
                    () => setAddingMoment(null),
                  )
                }
              >
                {c.title}
              </button>
            ))
          ) : (
            <p>Create a collection in the Collections workspace first.</p>
          )}
          {error && <p role="alert">{error}</p>}
        </Dialog>
      )}
      {share && (
        <Dialog title="Pass the context along" onClose={() => setShare(false)}>
          <p>
            Share a read-only link to <strong>{meeting.title}</strong>. It opens
            the latest saved notes on any device.
          </p>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeTime}
              onChange={(e) => {
                setIncludeTime(e.target.checked);
                setShareUrl("");
                setCopied(false);
              }}
            />
            Start at {formatTime(time)}
          </label>
          <p className="muted small">
            Workspace preference: {prefs.defaultVisibility}. Anyone with the
            link can view this fictional demo session; this demo has no
            authenticated private sharing. No audio leaves your browser.
          </p>
          {!shareUrl ? (
            <button
              className="primary"
              disabled={busy}
              onClick={() => void createShare()}
            >
              <Link2 size={16} />
              {busy ? "Creating…" : "Create share link"}
            </button>
          ) : (
            <>
              <label>
                Public link
                <input
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <div className="button-row">
                <button
                  className="primary"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(shareUrl)
                      .then(() => setCopied(true))
                      .catch(() =>
                        setError("Select the link above and copy it manually."),
                      );
                  }}
                >
                  <Copy size={15} />
                  {copied ? "Copied" : "Copy link"}
                </button>
                <a
                  className="secondary"
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open public view <ArrowUpRight size={15} />
                </a>
              </div>
            </>
          )}
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
        </Dialog>
      )}
    </section>
  );
}
