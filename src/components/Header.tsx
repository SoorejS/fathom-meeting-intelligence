"use client";

import React, { useState, useEffect } from "react";
import { Search, Gift, Settings, HelpCircle, User, Sparkles, ChevronDown, Check, Clock } from "lucide-react";

interface HeaderProps {
  onOpenSearch: () => void;
  onNavigateHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onNavigateHome }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenSearch]);

  return (
    <>
      <header className="h-14 border-b border-[#232834] bg-[#0E1117] px-4 flex items-center justify-between sticky top-0 z-30 select-none">
        {/* Left: Brand Logo & Wordmark */}
        <div className="flex items-center gap-6">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 group text-left cursor-pointer focus:outline-none"
            title="Return to My Calls"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-200">
              <span className="font-extrabold text-base tracking-tighter">f</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-white tracking-tight">fathom</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                AI
              </span>
            </div>
          </button>
        </div>

        {/* Center: Global Search Bar */}
        <div className="flex-1 max-w-xl mx-4">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-1.5 bg-[#151922] hover:bg-[#1B212D] border border-[#262C3A] hover:border-cyan-500/40 rounded-lg text-sm text-slate-400 transition-all duration-150 shadow-inner group"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              <span className="truncate text-slate-300">Search Call Recordings, Transcripts, Action Items...</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-[#0E1117] border border-[#2D3444] rounded">
                ⌘K
              </kbd>
            </div>
          </button>
        </div>

        {/* Right: Actions, Minutes Meter, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Refer button */}
          <button
            onClick={() => showToast("Referral link copied to clipboard ($50 credit)!")}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 rounded-md text-xs font-medium transition-colors"
          >
            <Gift className="w-3.5 h-3.5 text-amber-400" />
            <span>Refer & Earn</span>
          </button>

          {/* Points / Recording indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-[#151922] border border-[#262C3A] rounded-md text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-white">2,450</span>
            <span className="text-slate-400">min left</span>
          </div>

          {/* Help & Feedback */}
          <button
            onClick={() => showToast("Help Center: Documentation & Chat Support active.")}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#1B212D] rounded-md transition-colors"
            title="Help & Feedback"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={() => showToast("Settings: Zoom/Google Meet auto-record is enabled.")}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#1B212D] rounded-md transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-[#232834] mx-0.5" />

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 hover:bg-[#1B212D] rounded-lg transition-colors focus:outline-none"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white border border-cyan-400/30">
                SS
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#161B24] border border-[#2A3142] rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-[#232834]">
                  <p className="text-xs font-semibold text-white">Soorej S</p>
                  <p className="text-[11px] text-slate-400 truncate">soorej22subra@gmail.com</p>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Fathom Pro Workspace</span>
                  </div>
                </div>
                <div className="py-1 text-xs text-slate-300">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      showToast("Workspace switched to Personal Calls");
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#1F2633] transition-colors"
                  >
                    Personal Calls
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      showToast("Workspace switched to Team Engineering");
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#1F2633] transition-colors"
                  >
                    Engineering Team
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      showToast("Preferences opened");
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#1F2633] transition-colors"
                  >
                    Account Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#161B24] border border-cyan-500/40 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl shadow-cyan-950/40 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-3.5 h-3.5 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
};
