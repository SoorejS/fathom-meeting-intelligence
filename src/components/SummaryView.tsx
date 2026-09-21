"use client";

import React, { useState } from "react";
import { SummaryTemplates, SummaryTemplateKey } from "@/types/meeting";
import { Sparkles, Copy, Check, ChevronDown, CheckCircle2, ArrowRight, Lightbulb, ShieldAlert } from "lucide-react";

interface SummaryViewProps {
  summaryTemplates: SummaryTemplates;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ summaryTemplates }) => {
  const [activeTemplate, setActiveTemplate] = useState<SummaryTemplateKey>("default");
  const [copied, setCopied] = useState(false);

  const currentSummary = summaryTemplates[activeTemplate] || summaryTemplates.default;

  const templateOptions: { key: SummaryTemplateKey; label: string; desc: string }[] = [
    { key: "default", label: "Standard Meeting Intelligence", desc: "Balanced overview, decisions & next steps" },
    { key: "executive", label: "Executive Strategic Brief", desc: "Concise outcomes for leadership review" },
    { key: "sales", label: "Sales & Client Follow-up", desc: "Commercial terms, pipeline impact & deals" },
    { key: "engineering", label: "Engineering Technical Spec", desc: "Architecture, latency & system decisions" },
  ];

  const handleCopy = () => {
    const text = `
# ${currentSummary.title}

## Overview
${currentSummary.overview}

## Key Discussion Points
${currentSummary.keyPoints.map((kp) => `- ${kp}`).join("\n")}

## Decisions Made
${currentSummary.decisions.map((d) => `- ${d}`).join("\n")}

## Next Steps
${currentSummary.nextSteps.map((ns) => `- ${ns}`).join("\n")}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex flex-col h-full bg-[#11151F] border border-[#202736] rounded-2xl overflow-hidden shadow-xl">
      {/* Top Header with Template Selector & Copy Button */}
      <div className="p-3.5 border-b border-[#202736] bg-[#0E121A] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">AI Summary</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Fathom AI 3.8
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Select template to transform layout</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Fathom-style Template Switcher Dropdown */}
          <div className="relative">
            <select
              value={activeTemplate}
              onChange={(e) => setActiveTemplate(e.target.value as SummaryTemplateKey)}
              className="bg-[#171D2A] hover:bg-[#1E2536] border border-[#2B3548] text-xs text-white font-medium rounded-lg px-2.5 py-1.5 pr-7 appearance-none cursor-pointer focus:outline-none focus:border-cyan-500 transition-colors shadow-sm"
            >
              {templateOptions.map((opt) => (
                <option key={opt.key} value={opt.key} className="bg-[#131722] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Copy Summary Action */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#171D2A] hover:bg-[#1E2536] border border-[#2B3548] text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Copy formatted markdown summary"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Content Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
        {/* Template Banner */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-950/30 to-blue-950/20 border border-cyan-500/20 flex items-start gap-3">
          <div className="p-1 rounded-md bg-cyan-500/20 text-cyan-300 mt-0.5">
            <Lightbulb className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white">{currentSummary.title}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {templateOptions.find((t) => t.key === activeTemplate)?.desc}
            </p>
          </div>
        </div>

        {/* Section 1: Overview */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Overview</h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed bg-[#131722] p-3.5 rounded-xl border border-[#212838]">
            {currentSummary.overview}
          </p>
        </div>

        {/* Section 2: Key Discussion Points */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Key Discussion Points
            </h4>
          </div>
          <div className="space-y-2">
            {currentSummary.keyPoints.map((kp, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-[#131722] border border-[#212838] text-xs text-slate-300 leading-relaxed group hover:border-cyan-500/30 transition-colors"
              >
                <span className="w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="flex-1">{kp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Decisions Made */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Decisions Made
            </h4>
          </div>
          <div className="space-y-2">
            {currentSummary.decisions.map((dec, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-950/10 border border-emerald-500/20 text-xs text-slate-200 leading-relaxed"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="flex-1 font-medium">{dec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Next Steps */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Next Steps</h4>
          </div>
          <div className="space-y-2">
            {currentSummary.nextSteps.map((ns, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-950/10 border border-amber-500/20 text-xs text-slate-200 leading-relaxed"
              >
                <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="flex-1">{ns}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
