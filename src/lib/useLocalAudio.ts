"use client";
import { useEffect, useState } from "react";
import { readRecording } from "./localRecording";
export function useLocalAudio(id: string, expected: boolean) {
  const [audio, setAudio] = useState<{ id: string; url?: string; unavailable?: boolean }>({ id: "" });
  useEffect(() => {
    if (!expected) return;
    let cancelled = false;
    let url: string | undefined;
    readRecording(id).then(blob => {
      if (cancelled) return;
      if (blob) { url = URL.createObjectURL(blob); setAudio({ id, url }); }
      else setAudio({ id, unavailable: true });
    }).catch(() => { if (!cancelled) setAudio({ id, unavailable: true }); });
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [id, expected]);
  return expected && audio.id === id ? audio : { id, url: undefined, unavailable: false };
}
