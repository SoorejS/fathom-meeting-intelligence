"use client";
import { useState } from "react";
import { FAQS, answerSupportQuestion } from "@/lib/supportAnswers";
import { api } from "@/lib/api";
export function RelayHelp({ onCapture }: { onCapture(): void }) {
  const [query, setQuery] = useState(""),
    [answer, setAnswer] = useState(""),
    [kind, setKind] = useState("idea"),
    [topic, setTopic] = useState("General"),
    [message, setMessage] = useState(""),
    [rating, setRating] = useState(5),
    [result, setResult] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="guide">
      <label>
        Search help
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Recording, collections, signals…"
        />
      </label>
      {FAQS.filter((f) =>
        (f.question + " " + f.answer)
          .toLowerCase()
          .includes(query.toLowerCase()),
      ).map((f) => (
        <details key={f.question}>
          <summary>{f.question}</summary>
          <p>{f.answer}</p>
        </details>
      ))}
      <button
        className="secondary"
        onClick={() => setAnswer(answerSupportQuestion(query))}
      >
        Ask about Relay
      </button>
      {answer && <p role="status">{answer}</p>}
      <button className="text-button" onClick={onCapture}>
        Try a consented capture session
      </button>
      <h3>Feedback & support</h3>
      <p className="muted small">
        Saved to this demo workspace; no email or external support ticket is
        sent.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
          void api<{ id: string }>("/feedback", "POST", {
            kind,
            message,
            rating,
            topic,
          })
            .then((r) => {
              setResult(`Saved reference: ${r.id}`);
              setMessage("");
            })
            .catch((e) => setResult(e.message))
            .finally(() => setBusy(false));
        }}
      >
        <label>
          Type
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {["idea", "bug", "other", "support"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        {kind === "support" && (
          <label>
            Topic
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              {[
                "General",
                "Capture",
                "Sessions",
                "Sharing",
                "Collections",
                "Signals",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        )}
        <label>
          Rating
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Your message
          <textarea
            required
            maxLength={2000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
        <button className="primary" disabled={busy}>
          Save feedback
        </button>
        <p role="status">{result}</p>
      </form>
    </div>
  );
}
