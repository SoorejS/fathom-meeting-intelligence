"use client";

import React, { useState } from "react";
import { ActionItem } from "@/types/meeting";
import { CheckSquare, Square, Calendar, User, Clock, Check, Plus, Play } from "lucide-react";

interface ActionItemsViewProps {
  actionItems: ActionItem[];
  onToggleStatus: (id: string) => void;
  onSeek: (seconds: number) => void;
  onAddActionItem: (text: string, owner: string, dueDate: string) => void;
}

export const ActionItemsView: React.FC<ActionItemsViewProps> = ({
  actionItems,
  onToggleStatus,
  onSeek,
  onAddActionItem,
}) => {
  const [filter, setFilter] = useState<"all" | "open" | "completed">("all");
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newDueDate, setNewDueDate] = useState("Friday, 5:00 PM");

  const filteredItems = actionItems.filter((item) => {
    if (filter === "open") return item.status === "open";
    if (filter === "completed") return item.status === "completed";
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || !newOwner.trim()) return;
    onAddActionItem(newText, newOwner, newDueDate);
    setNewText("");
    setNewOwner("");
    setIsAdding(false);
  };

  const openCount = actionItems.filter((i) => i.status === "open").length;
  const completedCount = actionItems.filter((i) => i.status === "completed").length;

  return (
    <div className="flex flex-col h-full bg-[#11151F] border border-[#202736] rounded-2xl overflow-hidden shadow-xl">
      {/* Header Bar */}
      <div className="p-3.5 border-b border-[#202736] bg-[#0E121A] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white">Action Items</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
            {openCount} Open
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {completedCount} Completed
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter buttons */}
          <div className="flex items-center gap-0.5 bg-[#171D2A] border border-[#262F41] rounded-lg p-0.5 text-xs">
            {(["all", "open", "completed"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-2 py-1 rounded-md text-[10px] font-medium capitalize transition-colors ${
                  filter === st
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Add custom action button */}
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-medium text-cyan-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Inline Quick Add Form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="p-3.5 bg-[#161C28] border-b border-[#252E3E] space-y-2.5 animate-in fade-in duration-100">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Action item task description..."
            className="w-full px-3 py-1.5 bg-[#0F131C] border border-[#273244] rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
              placeholder="Assignee (e.g. Sarah Chen)"
              className="flex-1 px-3 py-1 bg-[#0F131C] border border-[#273244] rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
            <input
              type="text"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              placeholder="Due date (e.g. Friday)"
              className="w-36 px-3 py-1 bg-[#0F131C] border border-[#273244] rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {/* Action Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <p>No action items match the current filter.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isCompleted = item.status === "completed";
            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all duration-150 flex items-start gap-3 group ${
                  isCompleted
                    ? "bg-[#10141D]/60 border-[#1E2533] opacity-75"
                    : "bg-[#141924] border-[#242D3E] hover:border-cyan-500/40"
                }`}
              >
                {/* Toggle Checkbox */}
                <button
                  onClick={() => onToggleStatus(item.id)}
                  className="mt-0.5 text-slate-400 hover:text-cyan-400 transition-colors focus:outline-none cursor-pointer"
                  title={isCompleted ? "Mark as open" : "Mark as completed"}
                >
                  {isCompleted ? (
                    <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center text-black font-bold">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded border-2 border-slate-500 group-hover:border-cyan-400" />
                  )}
                </button>

                {/* Body: Text & Metadata */}
                <div className="flex-1 min-w-0 space-y-2">
                  <p
                    className={`text-xs leading-relaxed font-medium transition-colors ${
                      isCompleted ? "line-through text-slate-400" : "text-slate-100"
                    }`}
                  >
                    {item.text}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    {/* Owner chip */}
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          item.ownerColor || "bg-cyan-600"
                        } text-white flex items-center justify-center text-[7px] font-bold`}
                      >
                        {item.ownerInitials || item.owner.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-300">{item.owner}</span>
                    </div>

                    {/* Due date */}
                    {item.dueDate && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>{item.dueDate}</span>
                      </div>
                    )}

                    {/* Source Timestamp with Player Seek link */}
                    <button
                      onClick={() => onSeek(item.sourceTimestamp)}
                      className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                      title={`Jump playback to ${item.sourceTimestampFormatted}`}
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>{item.sourceTimestampFormatted}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
