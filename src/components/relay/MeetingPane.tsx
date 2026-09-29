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
import { Dialog } from "./Dialog";

export function MeetingPane({
  initial,
  onBack,
  onChanged,
  readOnly = false,
  initialTime = 0,
}: {
  initial: Meeting;
  onBack?(): void;
  onChanged?(): void;
  readOnly?: boolean;
  initialTime?: number;
}) {
  const [meeting, setMeeting] = useState(initial),
    [tab, setTab] = useState("Brief"),
    [time, setTime] = useState(initialTime),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [template, setTemplate] = useState<SummaryTemplateKey>("default");
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
  const localAudio = useLocalAudio(
    meeting.id,
    !!meeting.testCall?.hasLocalAudio,
  );
  const completed = meeting.actionItems.filter(
    (a) => a.status === "completed",
  ).length;
  useEffect(() => {
    if (!playing || localAudio.url) return;
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
  }, [playing, speed, meeting.duration, localAudio.url]);
  useEffect(() => {
    if (!audio.current) return;
    audio.current.playbackRate = speed;
    if (playing) audio.current.play().catch(() => setPlaying(false));
    else audio.current.pause();
  }, [playing, speed]);
  const seek = (n: number) => {
    setTime(n);
    if (audio.current) audio.current.currentTime = n;
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
  const summary = meeting.summary[template];
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
      {error && (
        <div className="notice error" role="alert">
          {error}
          <button onClick={() => setError("")} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}
      <div className="listening-bar">
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
          onClick={() => setSpeed(speed === 2 ? 1 : speed + 0.5)}
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
            onEnded={() => setPlaying(false)}
          />
        )}
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
                    setTemplate(e.target.value as SummaryTemplateKey)
                  }
                >
                  <option value="default">Full picture</option>
                  <option value="executive">Executive lens</option>
                  <option value="sales">Customer lens</option>
                  <option value="engineering">Engineering lens</option>
                </select>
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
              {meeting.transcript
                .filter((t) =>
                  (t.text + " " + t.speaker)
                    .toLowerCase()
                    .includes(transcriptQuery.toLowerCase()),
                )
                .map((t, i) => (
                  <article
                    key={t.id}
                    className={`transcript-line ${time >= t.timestamp && time < (meeting.transcript.find((s) => s.timestamp > t.timestamp)?.timestamp ?? meeting.duration + 1) ? "current" : ""}`}
                  >
                    <button
                      className="timestamp"
                      onClick={() => seek(t.timestamp)}
                    >
                      {t.timestampFormatted}
                    </button>
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
                              type: "Insight",
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
              {meeting.actionItems.map((a) => (
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
              {meeting.highlights.map((h) => (
                <article className="moment-card" key={h.id}>
                  <div>
                    <span className="tag">{h.type}</span>
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
                <div className="answer" role="status">
                  <p>{answer.answer}</p>
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
                required
                maxLength={80}
                value={highlight.type}
                onChange={(e) =>
                  setHighlight({ ...highlight, type: e.target.value })
                }
              />
            </label>
            <label>
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
            {error && <p className="error-text" role="alert">{error}</p>}
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
                  owner: meeting.participants[0]?.name || "Team",
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
            <p className="muted small">
              Assigned to {meeting.participants[0]?.name || "Team"} · linked to{" "}
              {formatTime(time)}
            </p>
            <button className="primary" disabled={busy}>
              {busy ? "Saving…" : "Save action"}
            </button>
            {error && <p className="error-text" role="alert">{error}</p>}
          </form>
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
            Anyone with the link can view this fictional demo session. No audio
            leaves your browser.
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
