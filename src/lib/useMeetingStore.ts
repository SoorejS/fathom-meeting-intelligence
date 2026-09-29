"use client";
import { useEffect, useState } from "react";
import type {
  Meeting,
  SummaryTemplateKey,
  TestCallDescriptor,
} from "@/types/meeting";
import { api } from "./api";
const pending = new Map<string, Promise<Meeting>>();
export function storeGeneratedCall(call: TestCallDescriptor): Promise<Meeting> {
  const existing = pending.get(call.id);
  if (existing) return existing;
  const task = api<Meeting>("/meetings", "POST", call)
    .then((meeting) => {
      window.dispatchEvent(new Event("relay:meetings"));
      return meeting;
    })
    .finally(() => pending.delete(call.id));
  pending.set(call.id, task);
  return task;
}
export function useMeetingStore() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [storageError, setError] = useState(false);
  const [templates, setTemplates] = useState<
    Record<string, SummaryTemplateKey>
  >({});
  useEffect(() => {
    const load = () => {
      api<Meeting[]>("/meetings")
        .then(setMeetings)
        .catch(() => setError(true));
    };
    load();
    window.addEventListener("relay:meetings", load);
    return () => window.removeEventListener("relay:meetings", load);
  }, []);
  return {
    meetings,
    templates,
    storageError,
    async updateMeeting(meeting: Meeting) {
      const prior = meetings.find((m) => m.id === meeting.id);
      if (!prior) return;
      try {
        for (const a of meeting.actionItems)
          if (prior.actionItems.find((p) => p.id === a.id)?.status !== a.status)
            await api(`/action-items/${a.id}`, "PATCH", { status: a.status });
        for (const h of meeting.highlights) {
          const old = prior.highlights.find((p) => p.id === h.id);
          if (!old) await api(`/meetings/${meeting.id}/highlights`, "POST", h);
          else if (old.type !== h.type || old.text !== h.text)
            await api(`/highlights/${h.id}`, "PATCH", h);
        }
        const fresh = await api<Meeting>(`/meetings/${meeting.id}`);
        setMeetings((all) => all.map((m) => (m.id === fresh.id ? fresh : m)));
      } catch {
        setError(true);
      }
    },
    setTemplate(id: string, template: SummaryTemplateKey) {
      setTemplates((old) => ({ ...old, [id]: template }));
    },
  };
}
