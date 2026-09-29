"use client";
import { useEffect, useState } from "react";
import { AudioLines } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Meeting } from "@/types/meeting";
import { MeetingPane } from "./MeetingPane";
export function PublicSession({ token }: { token: string }) {
  const [data, setData] = useState<{
      meeting: Meeting;
      timestamp: number;
    } | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    api<{ meeting: Meeting; timestamp: number }>(
      `/shares/${encodeURIComponent(token)}`,
    )
      .then(setData)
      .catch((e) => setError(e.message));
  }, [token]);
  return (
    <div className="public-shell">
      <header className="public-header">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <AudioLines size={22} />
          </span>
          relay.
        </Link>
        <span className="tag">Shared context · read only</span>
      </header>
      {error ? (
        <div className="empty">
          <h1>This session isn’t available.</h1>
          <p>{error}</p>
          <Link className="primary" href="/">
            Open Relay
          </Link>
        </div>
      ) : data ? (
        <MeetingPane
          initial={data.meeting}
          initialTime={data.timestamp}
          readOnly
        />
      ) : (
        <div className="loading" role="status">
          Loading the shared session from the database…
        </div>
      )}
    </div>
  );
}
