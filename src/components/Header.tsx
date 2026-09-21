"use client";

import React, { useState, useEffect } from "react";
import { Search, Gift, Settings, HelpCircle, Sparkles, Check, Menu, Bot } from "lucide-react";

interface HeaderProps {
  onStartTestCall: () => void;
  onOpenSearch: () => void;
  onNavigateHome: () => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onNavigateHome,
  onStartTestCall,
  onOpenSettings,
  onOpenHelp,
  onToggleMobileMenu,
}) => {
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
      <header className="h-14 border-b border-[#202227] bg-[#111215] px-2 sm:px-4 shrink-0 flex items-center justify-between sticky top-0 z-30 select-none">
        {/* Left: Brand Logo & Wordmark + Adjacent Search Bar */}
        <div className="flex items-center gap-2 sm:gap-6">
          {/* Mobile Navigation Toggle */}
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1e2026] md:hidden cursor-pointer"
              title="Open Navigation Menu"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 group text-left cursor-pointer focus:outline-none"
            title="Return to My Calls"
          >
            <span className="text-base sm:text-xl font-black text-white tracking-wider">FATHOM</span>
            {/* 3 cyan slanted pills logo mark */}
            <div className="hidden sm:flex items-center gap-[3px] -rotate-12 translate-y-[-1px]">
              <span className="w-1.5 h-4 bg-[#00c2ff] rounded-full"></span>
              <span className="w-1.5 h-3.5 bg-[#00c2ff] rounded-full"></span>
              <span className="w-1.5 h-2 bg-[#00c2ff] rounded-full"></span>
            </div>
          </button>

          {/* Search Bar adjacent to Logo */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2.5 px-3 py-1.5 bg-[#1e2026] hover:bg-[#252830] border border-[#2b2e38] hover:border-cyan-500/40 rounded-lg text-xs text-slate-400 transition-all duration-150 w-9 sm:w-52 md:w-64 group cursor-pointer"
            title="Search recordings (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors shrink-0" />
            <span className="hidden sm:block truncate text-slate-300 flex-1 text-left">Search Call Recordings</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-[#14151a] border border-[#2d303a] rounded">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Record Test Call, Refer, Settings, Help & Feedback, Points badge, Profile Avatar */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Dedicated Record Test Call Button */}
          <button
            onClick={onStartTestCall}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 text-xs font-semibold transition-all cursor-pointer"
            title="Launch interactive practice call"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Record Test Call</span>
          </button>

          {/* Refer button */}
          <button
            onClick={() => showToast("Referrals are outside this demo.")}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#1e2026] rounded-lg transition-colors cursor-pointer"
            title="Refer & Earn"
          >
            <Gift className="w-4 h-4 text-slate-400" />
            <span>Refer</span>
          </button>

          {/* Settings button */}
          <button
            onClick={() => {
              if (onOpenSettings) onOpenSettings();
              else showToast("Demo workspace settings");
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#1e2026] rounded-lg transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Help & Feedback button */}
          <button
            onClick={() => {
              if (onOpenHelp) onOpenHelp();
              else showToast("Help & documentation");
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#1e2026] rounded-lg transition-colors cursor-pointer"
            title="Help & Feedback"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span className="hidden md:inline">Help &amp; Feedback</span>
          </button>

          {/* Gold Star Points Badge */}
          <button
            onClick={() => showToast("Demo workspace — billing and rewards are not enabled.")}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-[#1e2026] hover:bg-[#252830] border border-amber-500/30 rounded-full text-xs font-bold text-amber-400 transition-colors cursor-pointer"
            title="30 Points"
          >
            <span className="text-amber-400">★</span>
            <span className="text-slate-100">30</span>
          </button>

          {/* Profile Avatar (Coral/Orange circle 'S') */}
          <div className="relative ml-1">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-7 h-7 rounded-full bg-[#e85a38] text-white flex items-center justify-center text-xs font-bold ring-1 ring-white/20 hover:ring-cyan-400 transition-all cursor-pointer focus:outline-none"
              title="Demo Reviewer (reviewer@example.com)"
            >
              S
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#16181d] border border-[#2a2d37] rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-[#22252c]">
                  <p className="text-xs font-semibold text-white">Demo Reviewer</p>
                  <p className="text-[11px] text-slate-400 truncate">reviewer@example.com</p>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Fathom Pro Workspace</span>
                  </div>
                </div>
                <div className="py-1 text-xs text-slate-300">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      showToast("Workspace: Personal Calls");
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#1e222a] transition-colors"
                  >
                    Personal Calls
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      showToast("Workspace: Engineering Team");
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#1e222a] transition-colors"
                  >
                    Engineering Team
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      showToast("This public demo does not require sign-in.");
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#1e222a] text-rose-400 transition-colors"
                  >
                    Logout
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
