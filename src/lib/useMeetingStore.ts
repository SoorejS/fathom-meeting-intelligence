"use client";
import type { Meeting, TestCallDescriptor } from "@/types/meeting";
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
