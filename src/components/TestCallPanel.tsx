"use client";
import { useState } from "react";
import { Bot, Mic, X, ShieldCheck } from "lucide-react";
import { CaptureEngine, PROCESS_STEPS, type CaptureState } from "@/lib/captureEngine";
import { formatTime, TEST_CUES, TEST_PARTICIPANTS } from "@/lib/testCallMeeting";

export function TestCallPanel({ state, engine, onClose, onOpenMeeting }: {
  state: CaptureState; engine: CaptureEngine; onClose(): void; onOpenMeeting(id: string): void;
}) {
  const [title, setTitle] = useState("Release readiness · Test Call");
  const [target, setTarget] = useState(30);
  const [mode, setMode] = useState<"microphone" | "simulated">("microphone");
  const [remember, setRemember] = useState(false);
  const button = "px-4 py-2.5 rounded-lg bg-cyan-400 text-slate-950 font-semibold text-sm hover:bg-cyan-300 disabled:opacity-40";
  const secondary = "px-4 py-2.5 rounded-lg border border-slate-600 text-sm text-slate-200 hover:bg-slate-800";
  const active = ["recording", "ending", "processing", "acquiring"].includes(state.phase);
  return <div role="dialog" aria-modal="true" aria-label="Fathom test call" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onKeyDown={e => { if (e.key === "Escape") onClose(); }}>
    <section className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-[#111722] shadow-2xl">
      <div className="flex items-center justify-between p-5 border-b border-slate-800">
        <div className="flex items-center gap-3"><Bot className="text-cyan-400" /><div><h2 className="font-semibold">Soorej&apos;s Fathom Notetaker</h2><p className="text-xs text-slate-400">Interactive test call · no Zoom connection</p></div></div>
        <button aria-label={active ? "Minimize test call" : "Close test call"} onClick={onClose} className="p-2 text-slate-400 hover:text-white"><X size={18} /></button>
      </div>
      <div className="p-5 space-y-5">
        {state.phase === "precall" ? <>
          <div className="space-y-2"><label htmlFor="test-title" className="text-sm">Meeting title</label><input id="test-title" value={title} maxLength={120} onChange={e => setTitle(e.target.value)} className="block w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm space-y-2 block">Duration target<select aria-label="Duration target" value={target} onChange={e => setTarget(Number(e.target.value))} className="block w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700">{[30,60,120,300].map(n => <option key={n} value={n}>{n < 60 ? `${n} seconds` : `${n/60} ${n === 60 ? "minute" : "minutes"}`}</option>)}</select></label>
            <label className="text-sm space-y-2 block">Capture mode<select aria-label="Capture mode" value={mode} onChange={e => setMode(e.target.value as typeof mode)} className="block w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700"><option value="microphone">Microphone audio</option><option value="simulated">Simulated capture</option></select></label>
          </div>
          <p className="text-xs text-slate-400 flex gap-2"><Mic size={16} />{mode === "microphone" ? "Microphone off. Access is requested only after you approve recording. If unavailable, the call continues in simulation." : "Simulated capture: no microphone, camera, or system audio is accessed."}</p>
          <p className="text-sm text-slate-300">Practice release readiness with a scripted participant. Scenario notes appear at 0, 5, 10, 15, 20 and 25 seconds; ending early includes only the moments reached. Audio stays in this browser. No speech-to-text service is used.</p>
          {state.preference && <div className="text-xs text-slate-400 flex justify-between items-center gap-2"><span>Saved preference: {state.preference}. Each call still asks for explicit consent.</span><button className="text-cyan-400" onClick={() => engine.clearPreference()}>Forget preference</button></div>}
          <button className={button} disabled={!title.trim()} onClick={() => engine.join({ version: 1, id: `test_${crypto.randomUUID()}`, title: title.trim(), date: new Date().toISOString(), duration: 0, captureMode: mode, hasLocalAudio: false }, target, mode)}>Join with Fathom Notetaker</button>
        </> : <>
          <h3 className="text-lg font-semibold break-words">{state.call?.title}</h3>
          <div className="flex items-center gap-2 text-sm" role="status"><span className={`w-2.5 h-2.5 rounded-full ${state.phase === "recording" ? "bg-red-400 animate-pulse" : "bg-cyan-400"}`} />
            {state.phase === "joining" ? "Joining…" : state.phase === "permission" ? "Connected · Permission required" : state.phase === "recording" ? `${state.call?.captureMode === "microphone" ? "Microphone recording" : "Simulated capture"} active` : state.phase === "processing" ? PROCESS_STEPS[state.step] : state.phase === "ending" ? "Ending meeting…" : state.phase === "complete" ? "Meeting ready" : state.phase === "acquiring" ? "Connected · Waiting for microphone" : state.phase === "declined" ? "Connected · Recording declined" : "Capture interrupted"}
          </div>
          {state.phase === "permission" && <div className="p-4 rounded-xl border border-cyan-500/40 bg-cyan-950/20 space-y-4">
            <ShieldCheck className="text-cyan-400" /><h3 className="font-semibold">Soorej&apos;s Fathom Notetaker is requesting to record this meeting</h3>
            <p className="text-sm text-slate-300">Approve to begin {state.requestedMode === "microphone" ? "local microphone recording" : "a simulated recording"}. The Notetaker cannot record before approval. Scenario notes are generated from the test script, not your speech.</p>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="mt-1 accent-cyan-400" />Apply these permissions to future requests</label>
            <p className="text-xs text-slate-400">Remembers your choice on this device; every new call still requires approval.{state.preference && ` Last saved choice: ${state.preference}.`}</p>
            <div className="flex gap-3"><button className={button} onClick={() => { void engine.approve(remember); }}>Approve</button><button className={secondary} onClick={() => engine.decline(remember)}>Decline</button></div>
          </div>}
          {state.message && <p className="text-sm text-slate-400">{state.message}</p>}
          {state.phase === "acquiring" && <button className={secondary} onClick={() => engine.useSimulation()}>Use simulated capture instead</button>}
          {state.phase === "recording" && <>
            <div className="flex items-center justify-between"><p aria-label="Elapsed recording time" className="text-4xl font-mono text-white">{formatTime(state.elapsed)}</p><span className="text-xs text-emerald-400">Consent approved · Connected</span></div>
            <p className="text-xs text-slate-400">Ends automatically at {formatTime(state.target)}. Only your microphone is captured in microphone mode.</p>
            <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-lg space-y-2"><p className="text-xs text-cyan-400 uppercase">Scenario notes · not live transcription</p>{TEST_CUES.filter(c => c.at <= state.elapsed).map(c => <p key={c.at} className="text-xs text-slate-300"><span className="font-mono text-cyan-400">{formatTime(c.at)}</span> {TEST_PARTICIPANTS[c.speaker].name}: {c.text}</p>)}</div>
            <button className="px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-400 text-white font-semibold" onClick={() => { void engine.end(); }}>End Meeting</button>
          </>}
          {state.phase === "processing" && <ol className="space-y-2 text-sm">{PROCESS_STEPS.map((step,i) => <li key={step} className={i <= state.step ? "text-cyan-300" : "text-slate-500"}>{i < state.step ? "✓" : i === state.step ? "◉" : "○"} {step}</li>)}</ol>}
          {state.phase === "interrupted" && <button className={button} onClick={() => { void engine.end(); }}>Finish saved test call</button>}
          {state.phase === "declined" && <button className={secondary} onClick={() => engine.open()}>Try another test call</button>}
          {state.phase === "complete" && <><p className="text-sm text-slate-300">Saved to My Calls · {formatTime(state.call?.duration || 0)}. Transcript, summary, actions and highlights use the same test timeline.{(state.call?.duration || 0) < 10 && " This short call ended before the first action-item cue."}</p><button className={button} onClick={() => { onOpenMeeting(state.call!.id); onClose(); }}>Open meeting</button></>}
        </>}
        <div className="border-t border-slate-800 pt-4"><p className="text-xs text-slate-400 mb-2">PARTICIPANTS</p><div className="flex flex-wrap gap-2">{TEST_PARTICIPANTS.map(p => <span key={p.id} className="text-xs rounded-lg px-3 py-2 bg-slate-800">{p.name} · {p.role}</span>)}</div></div>
      </div>
    </section>
  </div>;
}
