"use client";
import { useEffect, useSyncExternalStore } from "react";
import { CaptureEngine, initialCaptureState, recoverCapture, type CaptureState } from "./captureEngine";
import { startMicrophone, saveRecording } from "./localRecording";
import { storeGeneratedCall } from "./useMeetingStore";

const KEY = "fathom-test-capture-v1";
const serverState = initialCaptureState();
let engine: CaptureEngine | undefined;
let persistenceFailed = false;
function recover(): CaptureState {
  try { return recoverCapture(localStorage.getItem(KEY)); } catch { return initialCaptureState(); }
}
function getEngine() {
  if (!engine) {
    engine = new CaptureEngine({
      now: Date.now, record: startMicrophone, saveAudio: saveRecording, complete: storeGeneratedCall,
      later: (callback, ms) => setTimeout(callback, ms), cancel: id => clearTimeout(id),
      persist: state => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { persistenceFailed = true; } },
    }, recover());
  }
  return engine;
}
const subscribe = (listener: () => void) => getEngine().subscribe(listener);
const snapshot = () => getEngine().snapshot();
export function useTestCallCapture() {
  const state = useSyncExternalStore(subscribe, snapshot, () => serverState);
  useEffect(() => {
    const engine = getEngine();
    engine.resumeProcessing();
    if (engine.state.phase === "complete" && engine.state.call) storeGeneratedCall(engine.state.call);
    const stop = () => engine.interrupt();
    const resume = () => engine.resumeProcessing();
    window.addEventListener("pagehide", stop);
    window.addEventListener("pageshow", resume);
    return () => { window.removeEventListener("pagehide", stop); window.removeEventListener("pageshow", resume); engine.interrupt(); };
  }, []);
  return { state, engine: typeof window === "undefined" ? undefined : getEngine(), persistenceFailed };
}

