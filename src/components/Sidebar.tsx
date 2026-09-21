"use client";

import React from "react";
import { PhoneCall, Users, ListMusic, Bell, DollarSign, Bot, Radio, Plus } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  totalCallsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  totalCallsCount,
}) => {
  const navItems = [
    { id: "my-calls", label: "My Calls", icon: PhoneCall, count: totalCallsCount, primary: true },
    { id: "team-calls", label: "Team Calls", icon: Users, count: 2 },
    { id: "playlists", label: "Playlists", icon: ListMusic, count: 2 },
    { id: "alerts", label: "Alerts", icon: Bell },
    { id: "deals", label: "Deals", icon: DollarSign },
  ];

  return (
    <aside className="w-56 shrink-0 bg-[#0E1117] border-r border-[#232834] flex flex-col justify-between py-4 px-2.5 select-none hidden md:flex">
      {/* Top Section: Navigation Links */}
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="px-2.5 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 group ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-[#161B24]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? "bg-cyan-400/20 text-cyan-300"
                        : "bg-[#1C222E] text-slate-400 group-hover:text-slate-300"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Playlists Quick Lists */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2.5 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>Pinned Lists</span>
            <button
              onClick={() => alert("Playlist editing is outside this demo. Explore the two seeded playlists.")}
              className="hover:text-cyan-400 transition-colors"
              title="Create new playlist"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={() => onSelectTab("my-calls")}
            className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-200 hover:bg-[#161B24] transition-colors truncate flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Q4 Product Alignment</span>
          </button>
          <button
            onClick={() => onSelectTab("my-calls")}
            className="w-full text-left px-2.5 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-200 hover:bg-[#161B24] transition-colors truncate flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span>Customer Discovery</span>
          </button>
        </div>
      </div>

      {/* Bottom Section: Bot Status & Usage */}
      <div className="space-y-3 pt-4 border-t border-[#232834]">
        {/* Bot active badge */}
        <div className="p-2.5 bg-[#141822] border border-[#242B3A] rounded-xl flex items-center gap-2.5">
          <div className="relative">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bot className="w-4 h-4" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#141822]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-xs font-semibold text-white truncate">Fathom Notetaker</p>
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-400 truncate">Demo capture · not connected</p>
          </div>
        </div>

        {/* Plan usage meter */}
        <div className="px-2.5 py-2 bg-[#121620] rounded-lg border border-[#202634] space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Plan Recording</span>
            <span className="font-semibold text-cyan-400">42 / 100 hrs</span>
          </div>
          <div className="w-full h-1.5 bg-[#1E2533] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: "42%" }} />
          </div>
          <div className="flex items-center justify-between pt-0.5 text-[10px] text-slate-400">
            <span>Free Tier</span>
            <button
              onClick={() => alert("Upgrade dialog: Unlimited hours available with Fathom Pro")}
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Upgrade
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
