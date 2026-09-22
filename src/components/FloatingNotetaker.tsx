"use client";

import { useEffect, useRef, useState, type ReactNode, type PointerEvent, type KeyboardEvent } from "react";
import { Bot, GripVertical, Minus, X, Maximize2 } from "lucide-react";
import { constrainFloatingPosition, type FloatingPosition } from "@/lib/floatingPosition";

export function FloatingNotetaker({ children, footer, minimized, onMinimize, onRestore, onClose, recording, label }: {
  children: ReactNode; footer?: ReactNode; minimized: boolean; onMinimize(): void; onRestore(): void;
  onClose?: () => void; recording: boolean; label: string;
}) {
  const panel = useRef<HTMLElement>(null);
  const handle = useRef<HTMLButtonElement>(null);
  const restore = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const [position, setPosition] = useState<FloatingPosition | null>(null);
  const constrain = (next: FloatingPosition) => {
    const box = panel.current!.getBoundingClientRect();
    return constrainFloatingPosition(next, box.width, box.height, window.innerWidth, window.innerHeight);
  };
  useEffect(() => {
    const element = panel.current;
    if (!element) return;
    const keepVisible = () => setPosition(current => {
      if (!current) return current;
      const box = element.getBoundingClientRect();
      const next = constrainFloatingPosition(current, box.width, box.height, window.innerWidth, window.innerHeight);
      return next.x === current.x && next.y === current.y ? current : next;
    });
    const observer = new ResizeObserver(keepVisible);
    observer.observe(element);
    window.addEventListener("resize", keepVisible);
    return () => { observer.disconnect(); window.removeEventListener("resize", keepVisible); };
  }, []);
  const focusWithinPanel = (target: HTMLButtonElement | null) => {
    if (document.activeElement === document.body || panel.current?.contains(document.activeElement)) target?.focus();
  };
  const minimize = () => { onMinimize(); requestAnimationFrame(() => focusWithinPanel(restore.current)); };
  const expand = () => { onRestore(); requestAnimationFrame(() => focusWithinPanel(handle.current)); };
  const startDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const box = panel.current!.getBoundingClientRect();
    drag.current = { x: event.clientX, y: event.clientY, left: box.left, top: box.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag.current) return;
    setPosition(constrain({ x: drag.current.left + event.clientX - drag.current.x, y: drag.current.top + event.clientY - drag.current.y }));
  };
  const moveWithKeyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Home") { event.preventDefault(); setPosition(null); return; }
    const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (!direction) return;
    event.preventDefault();
    const box = panel.current!.getBoundingClientRect(), step = event.shiftKey ? 40 : 16;
    setPosition(constrain({ x: box.left + direction[0] * step, y: box.top + direction[1] * step }));
  };
  const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-inset";
  return <aside ref={panel} aria-label="Fathom test call" style={!minimized && position ? { left: position.x, top: position.y } : { right: 12, bottom: 12 }}
    className={`fixed z-40 rounded-xl border border-slate-700 bg-[#111722] text-slate-100 shadow-lg shadow-black/30 ${minimized ? "w-max max-w-[calc(100vw-24px)]" : "w-[min(360px,calc(100vw-24px))]"}`}
    onKeyDown={event => { if (event.key === "Escape" && !minimized) { event.stopPropagation(); minimize(); } }}>
    {minimized && <button ref={restore} aria-label={`Restore Notetaker · ${label}`} onClick={expand} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs ${focus}`}>
      <span className={`h-2 w-2 shrink-0 rounded-full ${recording ? "bg-red-400 animate-pulse" : "bg-cyan-400"}`} />
      <span className="font-semibold tabular-nums">{label}</span><span className="text-slate-400">Notetaker</span><Maximize2 size={14} />
    </button>}
    <div hidden={minimized}>
      <div className="flex max-h-[min(65dvh,640px)] flex-col">
        <header className="flex shrink-0 items-center gap-1 border-b border-slate-800 p-2">
          <button ref={handle} aria-label="Move Notetaker. Drag or use arrow keys; Home resets position." onPointerDown={startDrag} onPointerMove={moveDrag}
            onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }} onKeyDown={moveWithKeyboard}
            className={`flex min-w-0 flex-1 touch-none select-none items-center gap-2 rounded-lg p-1.5 text-left cursor-grab active:cursor-grabbing ${focus}`}>
            <GripVertical size={14} className="shrink-0 text-slate-500" /><Bot size={18} className="shrink-0 text-cyan-400" />
            <span className="min-w-0"><span className="block text-xs font-semibold">Fathom Notetaker</span><span className={`block truncate text-[10px] tabular-nums ${recording ? "text-red-300" : "text-slate-400"}`}>{recording ? label : "Browser test call · no meeting bot"}</span></span>
          </button>
          <button aria-label="Minimize Notetaker" onClick={minimize} className={`rounded-lg p-2 text-slate-400 hover:text-white ${focus}`}><Minus size={16} /></button>
          {onClose && <button aria-label="Close test call" onClick={onClose} className={`rounded-lg p-2 text-slate-400 hover:text-white ${focus}`}><X size={16} /></button>}
        </header>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-3 space-y-3">{children}</div>
        {footer && <div className="shrink-0 border-t border-slate-800 p-3">{footer}</div>}
      </div>
    </div>
  </aside>;
}
