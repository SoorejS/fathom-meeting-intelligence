"use client";

import React, { useState } from "react";
import { SummaryTemplates, SummaryTemplateKey } from "@/types/meeting";
import {
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  Settings,
  Edit2,
  Undo2,
  FileText,
} from "lucide-react";

interface SummaryViewProps {
  summaryTemplates: SummaryTemplates;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ summaryTemplates }) => {
  const [activeTemplate, setActiveTemplate] = useState<SummaryTemplateKey>("default");
  const [copied, setCopied] = useState(false);
  const [bannerToast, setBannerToast] = useState<string | null>(null);

  const currentSummary = summaryTemplates[activeTemplate] || summaryTemplates.default;

  const templateOptions: { key: SummaryTemplateKey; label: string }[] = [
    { key: "default", label: "Enhanced" },
    { key: "executive", label: "Executive Brief" },
    { key: "sales", label: "Sales & Deals" },
    { key: "engineering", label: "Engineering Spec" },
  ];

  const handleCopy = async () => {
    const text = `
${currentSummary.title}

${currentSummary.overview}

Next Steps:
${currentSummary.nextSteps.map((ns) => `• ${ns}`).join("\n")}

Decisions Made:
${currentSummary.decisions.map((d) => `• ${d}`).join("\n")}
    `.trim();

    try { await navigator.clipboard.writeText(text); setCopied(true); }
    catch { setBannerToast("Clipboard unavailable. Select and copy the summary text."); }
    setTimeout(() => setCopied(false), 2500);
  };

  const showBannerToast = (msg: string) => {
    setBannerToast(msg);
    setTimeout(() => setBannerToast(null), 2500);
  };

  return (
    <div className="flex flex-col h-full space-y-4 pr-1">
      {/* 1. Fathom-style Controls Bar (Matching Screenshot 2228a0b3-d0d2-4b67-a9eb-18e9ba900015.png) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 select-none">
        <div className="flex items-center gap-2">
          {/* Template Selector Pill: [📋 Enhanced ▾] [⚙] */}
          <div className="inline-flex items-center rounded-lg bg-[#181a22] border border-[#272b38] text-xs text-white overflow-hidden shadow-sm">
            <div className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#202430] transition-colors relative cursor-pointer">
              <FileText className="w-3.5 h-3.5 text-[#00c2ff]" />
              <select aria-label="Summary template"
                value={activeTemplate}
                onChange={(e) => setActiveTemplate(e.target.value as SummaryTemplateKey)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none appearance-none pr-4 cursor-pointer"
              >
                {templateOptions.map((t) => (
                  <option key={t.key} value={t.key} className="bg-[#181a22] text-white">
                    {t.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 pointer-events-none" />
            </div>

            <button
              onClick={() => showBannerToast("Choose a summary template from the dropdown. Custom template editing is outside this demo.")}
              className="px-2 py-1.5 border-l border-[#272b38] hover:bg-[#202430] text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Template settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mode Pill: [✨ Auto ▾] */}
          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#181a22] border border-[#272b38] text-xs font-semibold text-white hover:bg-[#202430] transition-colors cursor-pointer">
            <Sparkles className="w-3 h-3 text-[#00c2ff]" />
            <span>Auto</span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </div>
        </div>

        {/* Copy Summary Button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#142633] hover:bg-[#1a3345] border border-[#00c2ff]/30 text-[#00c2ff] text-xs font-semibold transition-colors cursor-pointer"
          title="Copy formatted summary"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#10b981]" />
              <span className="text-[#10b981]">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Summary</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Customized Summary Generated Banner (Matching Screenshot 2228a0b3-d0d2-4b67-a9eb-18e9ba900015.png) */}
      <div className="p-2.5 rounded-xl bg-[#151720] border border-[#272b38] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-medium">Customized summary generated</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showBannerToast("Future recording preferences are outside this seeded demo.")}
            className="px-2.5 py-1 rounded-md border border-[#00c2ff]/40 hover:bg-[#00c2ff]/10 text-[#00c2ff] text-[11px] font-semibold transition-colors cursor-pointer"
          >
            Apply to Future Summaries
          </button>

          <button
            onClick={() => showBannerToast("Summary editing is outside this demo. Try another prepared template.")}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#202430] transition-colors"
            title="Edit Summary"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => { setActiveTemplate("default"); showBannerToast("Restored the Enhanced template"); }}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#202430] transition-colors"
            title="Undo Changes"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {bannerToast && (
        <div className="p-2 bg-[#00c2ff]/10 border border-[#00c2ff]/30 text-[#00c2ff] text-[11px] rounded-lg animate-in fade-in duration-100 flex items-center gap-1.5">
          <Check className="w-3 h-3" />
          <span>{bannerToast}</span>
        </div>
      )}

      {/* 3. Summary Content (Matching Live Fathom Typography & Clean Bullet Spacing) */}
      <div className="space-y-5 text-xs leading-relaxed text-slate-200">
        {/* Overview bullets */}
        <div className="space-y-2">
          <ul className="space-y-2 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>{currentSummary.overview}</span>
            </li>
            {currentSummary.keyPoints.map((kp, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-slate-400 mt-0.5">•</span>
                <span>{kp}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Next Steps Section */}
        <div className="space-y-2 pt-2">
          <h3 className="text-sm font-bold text-white tracking-tight">Next Steps</h3>
          <ul className="space-y-2 pl-1">
            {currentSummary.nextSteps.map((ns, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-slate-400 mt-0.5">•</span>
                <span>
                  <strong className="text-white font-semibold">Participant:</strong>{" "}
                  {ns.replace(/^Participant:\s*/i, "")}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Decisions Made Section */}
        <div className="space-y-2 pt-2 border-t border-[#1f222c]">
          <h3 className="text-sm font-bold text-white tracking-tight">Decisions Made</h3>
          <ul className="space-y-2 pl-1">
            {currentSummary.decisions.map((dec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-300">
                <span className="text-[#10b981] mt-0.5">✓</span>
                <span>{dec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
