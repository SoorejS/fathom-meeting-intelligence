"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { UpcomingMeeting } from "@/types/upcoming";
import { formatProviderLabel } from "@/services/upcomingService";
export function UpcomingSessions({
  onCapture,
}: {
  onCapture(title: string): void;
}) {
  const [rows, setRows] = useState<UpcomingMeeting[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    api<UpcomingMeeting[]>("/upcoming")
      .then(setRows)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <section className="preference-card">
      <h2>Scheduled sessions</h2>
      <p className="muted">
        Demo calendar · dates below are fixed examples, not a connected
        calendar. Joining opens a browser simulation.
      </p>
      {rows.map((m) => (
        <article className="upcoming-session" key={m.id}>
          <span className="tag">{formatProviderLabel(m.provider).label}</span>
          <h3>{m.title}</h3>
          <p>
            {m.startTimeFormatted} · {m.durationMinutes} minutes
          </p>
          <p className="muted small">
            {m.participants.map((p) => p.name).join(" · ")}
          </p>
          <div className="button-row">
            <button
              className="secondary"
              role="switch"
              aria-checked={m.notetakerEnabled}
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void api(`/upcoming/${m.id}`, "PATCH", {
                  enabled: !m.notetakerEnabled,
                })
                  .then(() =>
                    setRows(
                      rows.map((r) =>
                        r.id === m.id
                          ? { ...r, notetakerEnabled: !r.notetakerEnabled }
                          : r,
                      ),
                    ),
                  )
                  .catch((e) => setError(e.message))
                  .finally(() => setBusy(false));
              }}
            >
              {m.notetakerEnabled ? "Notetaker armed" : "Notetaker off"}
            </button>
            <button className="secondary" onClick={() => onCapture(m.title)}>
              Join simulation
            </button>
            <button className="primary" onClick={() => onCapture(m.title)}>
              Record with Relay
            </button>
          </div>
        </article>
      ))}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
