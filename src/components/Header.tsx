"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Gift, Settings, LifeBuoy, Star, Menu, Video, BookOpen, HelpCircle, Code, Download, LogOut } from "lucide-react";

interface HeaderProps {
  onStartTestCall: () => void;
  onOpenSearch: () => void;
  onNavigateHome: () => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
  onToggleMobileMenu?: () => void;
  settingsActive?: boolean;
}

export function FathomMark({ className = "w-6 h-7" }: { className?: string }) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 28 32" fill="none"><path d="M5 5L23 14M5 15L15 20M5 25L7 26" stroke="#00b9e9" strokeWidth="7" strokeLinecap="round" /></svg>;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onNavigateHome, onStartTestCall, onOpenSettings, onOpenHelp, onToggleMobileMenu, settingsActive }) => {
  const [popover, setPopover] = useState<"profile" | "refer" | "points" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); onOpenSearch(); }
      if (e.key === "Escape") setPopover(null);
    };
    const onPointer = (e: PointerEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setPopover(null); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("pointerdown", onPointer); };
  }, [onOpenSearch]);
  const act = (action?: () => void) => { setPopover(null); action?.(); };
  const toggle = (value: typeof popover) => setPopover(popover === value ? null : value);
  return <header className="fathom-header">
    <div className="flex items-center gap-3 sm:gap-7 min-w-0">
      {onToggleMobileMenu && <button onClick={onToggleMobileMenu} className="md:hidden p-1 text-neutral-400" aria-label="Toggle navigation menu"><Menu size={21} /></button>}
      <button onClick={onNavigateHome} className="flex items-center gap-2 shrink-0" aria-label="FATHOM" title="Return to My Calls"><span className="text-xl sm:text-[30px] font-medium tracking-[-1px] text-white">FATHOM</span><FathomMark className="w-5 sm:w-6 h-7" /></button>
      <button onClick={onOpenSearch} className="header-search" aria-label="Search Call Recordings" title="Search recordings (Ctrl/⌘ K)"><Search size={17} /><span className="hidden sm:inline truncate">Search Call Recordings</span></button>
    </div>
    <div ref={menuRef} className="flex items-center gap-1 sm:gap-2 relative shrink-0">
      <button onClick={() => toggle("refer")} aria-expanded={popover === "refer"} className="header-action hidden lg:flex"><Gift size={23} /><span>Refer</span></button>
      <button onClick={() => act(onOpenSettings)} aria-label="Settings" className={`header-action ${settingsActive ? "bg-white/10 text-white" : ""}`}><Settings size={23} /><span className="hidden lg:inline">Settings</span></button>
      <button onClick={() => act(onOpenHelp)} aria-label="Help & Feedback" className="header-action"><LifeBuoy size={23} /><span className="hidden lg:inline">Help &amp; Feedback</span></button>
      <button onClick={() => toggle("points")} aria-expanded={popover === "points"} className="hidden sm:flex items-center gap-1 px-2 text-[#ffca28] font-bold text-xl" aria-label="30 Points"><Star size={23} fill="currentColor" /><span>30</span></button>
      <button onClick={() => toggle("profile")} aria-label="Profile menu" aria-expanded={popover === "profile"} className="w-9 h-9 rounded-full bg-[#ff5120] text-white text-lg ml-1">S</button>
      {popover === "profile" && <div className="header-popover w-72 py-2" aria-label="Profile options">
        <button onClick={() => act(onStartTestCall)}><Video size={16} />Start Test Call</button>
        <button onClick={() => act(onOpenHelp)}><BookOpen size={16} />Tutorial</button>
        <button onClick={() => act(onOpenHelp)}><HelpCircle size={16} />FAQs</button>
        <button onClick={() => act(onOpenHelp)}><Code size={16} />Developers</button>
        <div className="my-2 border-t border-white/10" />
        <p className="px-4 py-2 text-xs text-neutral-400">Browser demo · no account required. Audio and preferences stay on this device.</p>
        <button onClick={() => act(onOpenHelp)}><Download size={16} />About this demo</button>
        <button onClick={() => act(onNavigateHome)}><LogOut size={16} />Back to My Calls</button>
        <div className="border-t border-white/10 px-4 pt-3 pb-1 mt-2"><p className="text-xs text-neutral-400">Viewing as</p><p>Demo Reviewer</p></div>
      </div>}
      {popover === "refer" && <div className="header-popover w-80 p-5 text-center"><Gift className="mx-auto mb-3 text-cyan-400" size={28}/><h2 className="text-lg font-semibold text-cyan-400">REFERRAL CODE</h2><p className="text-sm text-neutral-300 mt-3">Referral rewards are not connected in this demo. You can share any meeting using its Share button.</p></div>}
      {popover === "points" && <div className="header-popover w-72 p-5 !bg-[#ffca28] !text-[#28251a] text-center"><Star className="mx-auto mb-3" size={32} fill="currentColor"/><h2 className="text-xl font-semibold">You have 30 points</h2><p className="text-sm mt-3">Reference preview only. Rewards and prize drawings are not active in this demo.</p></div>}
    </div>
  </header>;
};
