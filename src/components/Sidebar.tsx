"use client";
import React from "react";
import { PhoneCall, Users, ListMusic, Bell, DollarSign, Calendar } from "lucide-react";

interface SidebarProps {
  notetakerStatus?: string;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  totalCallsCount: number;
  teamCallsCount: number;
  onSelectPlaylist: (id: string) => void;
  playlists?: { id: string; title: string }[];
  onCreatePlaylistClick?: () => void;
  trackersCount?: number;
  upcomingCount?: number;
  isMobileDrawer?: boolean;
}
export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, totalCallsCount, teamCallsCount, playlists = [], onSelectPlaylist, trackersCount, upcomingCount, isMobileDrawer = false }) => {
  const items = [
    { id: "my-calls", label: "My Calls", icon: PhoneCall, count: totalCallsCount },
    { id: "team-calls", label: "Team Calls", icon: Users, count: teamCallsCount },
    { id: "playlists", label: "Playlists", icon: ListMusic, count: playlists.length },
    { id: "alerts", label: "Alerts", icon: Bell, count: trackersCount },
    { id: "deals", label: "Deals", icon: DollarSign },
    { id: "upcoming", label: "Upcoming", icon: Calendar, count: upcomingCount },
  ];
  return <nav aria-label={isMobileDrawer ? "Mobile workspace" : "Workspace"} className={isMobileDrawer ? "p-3 space-y-2 bg-[#202022] h-full" : "workspace-tabs"}>
    {items.map(({ id, label, icon: Icon, count }) => <button key={id} onClick={() => onSelectTab(id)} aria-current={activeTab === id ? "page" : undefined} className={isMobileDrawer ? `flex w-full items-center gap-3 p-3 rounded-md text-sm ${activeTab === id ? "text-cyan-400 bg-white/5" : "text-neutral-300"}` : `workspace-tab ${activeTab === id ? "is-active" : ""}`}>
      {isMobileDrawer && <Icon size={18} />}<span>{label}</span>{isMobileDrawer && count !== undefined && <span className="ml-auto text-neutral-400 text-xs">{count}</span>}
    </button>)}
    {isMobileDrawer && playlists.length > 0 && <div className="pt-6 space-y-1"><h2 className="px-3 text-xs uppercase text-neutral-500">Pinned lists</h2>{playlists.slice(0, 4).map(p => <button key={p.id} onClick={() => onSelectPlaylist(p.id)} className="block w-full px-3 py-2 text-left text-sm text-neutral-300 truncate">{p.title}</button>)}</div>}
  </nav>;
};
