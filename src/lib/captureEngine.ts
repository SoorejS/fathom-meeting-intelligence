import { isTestCall } from "./testCallMeeting";
import type { TestCallDescriptor } from "../types/meeting";

export type CapturePhase = "ready" | "precall" | "joining" | "permission" | "acquiring" | "declined" | "recording" | "interrupted" | "ending" | "processing" | "complete";
export interface CaptureState {
  phase: CapturePhase;
  call: TestCallDescriptor | null;
  target: number;
  requestedMode: "microphone" | "simulated";
  elapsed: number;
  step: number;
  message: string;
  consent: boolean;
  preference: "approve" | "decline" | null;
}
export interface RecordingHandle { stop(): Promise<Blob | null>; abort(): void; isActive?(): boolean }
export interface CaptureDependencies {
  now(): number;
  persist(state: CaptureState): void;
  record(signal: AbortSignal): Promise<RecordingHandle>;
  saveAudio(id: string, blob: Blob): Promise<void>;
  complete(call: TestCallDescriptor): void;
  later(callback: () => void, ms: number): ReturnType<typeof setTimeout>;
  cancel(id: ReturnType<typeof setTimeout>): void;
}
export const initialCaptureState = (): CaptureState => ({ phase: "ready", call: null, target: 30, requestedMode: "microphone", elapsed: 0, step: 0, message: "", consent: false, preference: null });
export const PROCESS_STEPS = ["Processing recording", "Generating scenario transcript", "Generating summary", "Extracting action items", "Generating highlights"];

// One engine per open workspace. It owns the recorder independently of modal visibility.
export class CaptureEngine {
  state: CaptureState;
  private listeners = new Set<() => void>();
  private timer?: ReturnType<typeof setTimeout>;
  private recorder?: RecordingHandle;
  private accessAbort?: AbortController;
  private generation = 0;
  private started = 0;
  constructor(private deps: CaptureDependencies, recovered = initialCaptureState()) { this.state = recovered; }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  snapshot = () => this.state;
  private update(patch: Partial<CaptureState>) {
    this.state = { ...this.state, ...patch };
    this.deps.persist(this.state);
    this.listeners.forEach(listener => listener());
  }
  private clearTimer() { if (this.timer !== undefined) this.deps.cancel(this.timer); }
  private schedule(callback: () => void, ms: number) { this.clearTimer(); this.timer = this.deps.later(callback, ms); }
  open() {
    if (!["ready", "complete", "declined"].includes(this.state.phase)) return;
    this.update({ ...initialCaptureState(), phase: "precall", preference: this.state.preference });
  }
  join(call: TestCallDescriptor, target: number, mode: "microphone" | "simulated") {
    if (this.state.phase !== "precall") return;
    this.update({ call, target, requestedMode: mode, phase: "joining", message: "Connecting the test Notetaker…", consent: false });
    this.schedule(() => this.update({ phase: "permission", message: "Connected · recording permission required" }), 900);
  }
  decline(remember: boolean) {
    if (this.state.phase !== "permission") return;
    this.update({ phase: "declined", consent: false, message: "Recording declined. No microphone was accessed and no meeting was created.", preference: remember ? "decline" : this.state.preference });
  }
  async approve(remember: boolean) {
    if (this.state.phase !== "permission") return;
    this.update({ consent: true, preference: remember ? "approve" : this.state.preference });
    if (this.state.requestedMode === "simulated") { this.startSimulation("Simulated capture selected. No microphone is used."); return; }
    this.update({ phase: "acquiring", message: "Waiting for microphone permission. You can use simulation instead." });
    const generation = ++this.generation;
    this.accessAbort = new AbortController();
    this.schedule(() => this.useSimulation(), 15000);
    try {
      const recorder = await this.deps.record(this.accessAbort.signal);
      if (generation !== this.generation || this.snapshot().phase !== "acquiring") { recorder.abort(); return; }
      this.clearTimer(); this.recorder = recorder;
      this.begin("microphone", "Microphone recording active · audio stays in this browser.");
    } catch {
      if (generation === this.generation && this.snapshot().phase === "acquiring") this.startSimulation("Microphone unavailable or permission denied. Continuing with simulated capture; no audio is recorded.");
    }
  }
  useSimulation() {
    if (this.state.phase !== "acquiring") return;
    ++this.generation; this.accessAbort?.abort();
    this.startSimulation("Continuing with simulated capture; no microphone audio is recorded.");
  }
  private startSimulation(message: string) { this.clearTimer(); this.begin("simulated", message); }
  private begin(mode: "microphone" | "simulated", message: string) {
    if (!this.state.consent || !this.state.call) return;
    this.started = this.deps.now();
    this.update({ phase: "recording", elapsed: 0, call: { ...this.state.call, date: new Date(this.started).toISOString(), captureMode: mode }, message });
    this.tick();
  }
  private tick = () => {
    if (this.state.phase !== "recording") return;
    if (this.recorder?.isActive && !this.recorder.isActive()) { void this.end(); return; }
    const elapsed = Math.min(this.state.target, Math.max(0, (this.deps.now() - this.started) / 1000));
    this.update({ elapsed });
    if (elapsed >= this.state.target) { void this.end(); return; }
    this.schedule(this.tick, 250);
  };
  async end() {
    if (!["recording", "interrupted"].includes(this.state.phase) || !this.state.call) return;
    const elapsed = this.state.phase === "recording" ? Math.min(this.state.target, Math.max(0, (this.deps.now() - this.started) / 1000)) : this.state.elapsed;
    this.clearTimer(); ++this.generation;
    this.update({ phase: "ending", elapsed, call: { ...this.state.call, duration: elapsed }, message: "Ending meeting and stopping capture…" });
    const recorder = this.recorder; this.recorder = undefined;
    if (recorder) {
      try {
        const blob = await recorder.stop();
        if (blob?.size) {
          try {
            await this.deps.saveAudio(this.state.call!.id, blob);
            this.update({ call: { ...this.state.call!, hasLocalAudio: true }, message: "Audio saved locally. Scenario notes are generated separately." });
          } catch { this.update({ message: "Local audio storage is unavailable. Your meeting notes will still be saved." }); }
        } else this.update({ message: "No usable audio was produced. The scenario timeline and notes are still available." });
      } catch { recorder.abort(); this.update({ message: "Audio recording was interrupted. Continuing with scenario notes and simulated playback." }); }
    }
    this.schedule(() => { this.update({ phase: "processing", step: 0, message: this.state.message.startsWith("Ending meeting") ? "Capture has stopped. Scenario notes are generated without an external speech-to-text service." : this.state.message }); this.process(); }, 450);
  }
  private process() {
    this.schedule(() => {
      if (this.state.phase !== "processing" || !this.state.call) return;
      if (this.state.step < PROCESS_STEPS.length - 1) { this.update({ step: this.state.step + 1 }); this.process(); }
      else {
        this.deps.complete(this.state.call);
        this.update({ phase: "complete" });
      }
    }, 550);
  }
  resumeProcessing() {
    if (["ending", "processing"].includes(this.state.phase)) { this.update({ phase: "processing", step: 0 }); this.process(); }
  }
  cancel() {
    if (["recording", "ending", "processing"].includes(this.state.phase)) return;
    this.clearTimer(); ++this.generation; this.accessAbort?.abort(); this.recorder?.abort(); this.recorder = undefined;
    this.update({ ...initialCaptureState(), preference: this.state.preference });
  }
  clearPreference() { this.update({ preference: null }); }
  interrupt() {
    this.clearTimer(); ++this.generation; this.accessAbort?.abort();
    const recorder = this.recorder; this.recorder = undefined; recorder?.abort();
    if (this.state.phase === "recording") this.update({ phase: "interrupted", message: "Capture stopped when this page was left. Finish processing the saved scenario timeline; interrupted microphone audio is unavailable." });
    else if (this.state.phase === "acquiring") this.update({ phase: "permission", consent: false, message: "Microphone request cancelled. Approve again to start a new recording." });
  }
  dispose() { this.interrupt(); }
}

export function recoverCapture(rawText: string | null): CaptureState {
  try {
    const raw = JSON.parse(rawText || "null");
    const state = initialCaptureState();
    if (["approve", "decline"].includes(raw?.preference)) state.preference = raw.preference;
    if (!isTestCall(raw?.call) || !Number.isFinite(raw.elapsed) || raw.elapsed < 0 || raw.elapsed > 300) return state;
    state.call = raw.call; state.elapsed = raw.elapsed;
    state.target = [30, 60, 120, 300].includes(raw.target) ? raw.target : 30;
    if (raw.phase === "complete") state.phase = "complete";
    else if (["recording", "interrupted"].includes(raw.phase)) {
      state.phase = "interrupted"; state.consent = true;
      state.message = "The page was closed during capture. Recording has stopped. Finish processing the saved scenario timeline; microphone audio from that interrupted recording may be unavailable.";
      state.call = { ...raw.call, duration: state.elapsed, hasLocalAudio: false };
    } else if (["ending", "processing"].includes(raw.phase)) {
      state.phase = "processing"; state.consent = true;
      state.message = "Resuming processing of the saved test call.";
    }
    return state;
  } catch { return initialCaptureState(); }
}
