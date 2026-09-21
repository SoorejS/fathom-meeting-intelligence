"use client";

import React, { useState, useMemo } from "react";
import {
  HelpCircle,
  Search,
  X,
  BookOpen,
  MessageSquare,
  LifeBuoy,
  Check,
  Star,
  Sparkles,
  ExternalLink,
  Bot,
  ListMusic,
  Bell,
  ChevronDown,
} from "lucide-react";

interface HelpFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTestCall?: () => void;
}

type HelpTab = "docs" | "feedback" | "support";

interface FAQItem {
  question: string;
  category: "notetaker" | "playlists" | "trackers" | "summaries";
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    category: "notetaker",
    question: "How does the Fathom Notetaker work?",
    answer:
      "This workspace runs consented browser test calls. Microphone audio stays local when available, with a labeled simulated fallback. Transcript, summary, actions, and highlights follow a deterministic scenario; no conferencing bot or speech recognition service is connected.",
  },
  {
    category: "notetaker",
    question: "Is microphone audio stored on external servers?",
    answer:
      "In this public preview workspace, recorded audio stays strictly in your browser using local IndexedDB/Blob storage. No audio is ever uploaded to external third-party servers.",
  },
  {
    category: "playlists",
    question: "What are Playlists and how do I create one?",
    answer:
      "Playlists allow you to curate key highlights and video moments across multiple meetings into a simulated reel preview. Navigate to Playlists in the sidebar or use '+ Add to Playlist' on any highlight in a meeting.",
  },
  {
    category: "trackers",
    question: "How do Keyword Trackers work?",
    answer:
      "Trackers automatically scan all transcript segments across your workspace for target keywords (such as pricing, security, blockers, or competitors). When a match occurs, you can click directly to the exact second in the discussion.",
  },
  {
    category: "summaries",
    question: "Can I customize the summary template?",
    answer:
      "Yes. In any meeting detail view, toggle between 'Default', 'Executive', 'Sales', and 'Technical' templates. You can also configure the default template in Settings > Summaries.",
  },
];

export const HelpFeedbackModal: React.FC<HelpFeedbackModalProps> = ({
  isOpen,
  onClose,
  onOpenTestCall,
}) => {
  const [activeTab, setActiveTab] = useState<HelpTab>("docs");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  // Feedback Form State
  const [feedbackType, setFeedbackType] = useState<"idea" | "bug" | "other">("idea");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Support Ticket State
  const [ticketTopic, setTicketTopic] = useState("Audio & Capture");
  const [ticketMessage, setTicketMessage] = useState("");
  const [generatedTicketId, setGeneratedTicketId] = useState<string | null>(null);

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return FAQS;
    const q = searchQuery.toLowerCase();
    return FAQS.filter(
      (item) =>
        item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setFeedbackSubmitted(false);
      setFeedbackText("");
      onClose();
    }, 2200);
  };

  const handleSupportTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMessage.trim()) return;
    const randomId = `FTHM-${Math.floor(1000 + Math.random() * 9000)}`;
    setGeneratedTicketId(randomId);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Help and feedback"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-[#11141D] border border-[#232A3B] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#1F2535] flex items-center justify-between bg-[#151924]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Help &amp; Feedback</h2>
              <p className="text-[11px] text-slate-400">
                Documentation, live support simulation, and feature feedback
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#202738] transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1F2535] bg-[#0E1118] px-4">
          <button
            onClick={() => setActiveTab("docs")}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === "docs"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Documentation &amp; FAQ</span>
          </button>

          <button
            onClick={() => setActiveTab("feedback")}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === "feedback"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Submit Feedback</span>
          </button>

          <button
            onClick={() => setActiveTab("support")}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === "support"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Simulated Support</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: Documentation & FAQ */}
          {activeTab === "docs" && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles and FAQs..."
                  className="w-full pl-9 pr-4 py-2 bg-[#171B26] border border-[#262E40] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Quick Feature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-[#141822] border border-[#232938] rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold">
                    <Bot className="w-3.5 h-3.5" />
                    <span>Practice Call</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Test recording cues, simulated participant notes, and consent gates.
                  </p>
                  {onOpenTestCall && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenTestCall();
                      }}
                      className="text-[10px] text-cyan-400 hover:underline pt-1 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Launch Test Call</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>

                <div className="p-3 bg-[#141822] border border-[#232938] rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-400 text-xs font-semibold">
                    <ListMusic className="w-3.5 h-3.5" />
                    <span>Highlight Reels</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Collect important takeaways in a timed, simulated reel preview.
                  </p>
                </div>

                <div className="p-3 bg-[#141822] border border-[#232938] rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
                    <Bell className="w-3.5 h-3.5" />
                    <span>Keyword Alerts</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Scan transcripts for pricing, objections, or project milestones.
                  </p>
                </div>
              </div>

              {/* Accordion FAQ List */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Frequently Asked Questions
                </h3>
                {filteredFaqs.map((faq, idx) => {
                  const isExpanded = expandedFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="border border-[#222838] bg-[#141822] rounded-xl overflow-hidden transition-colors"
                    >
                      <button
                        onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-semibold text-white hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        <span>{faq.question}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                            isExpanded ? "rotate-180 text-cyan-400" : ""
                          }`}
                        />
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-3 text-xs text-slate-300 leading-relaxed border-t border-[#1C2230] pt-2">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Submit Feedback */}
          {activeTab === "feedback" && (
            <div>
              {feedbackSubmitted ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Thank You for Your Feedback!</h4>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Demo feedback acknowledged for this session only. Nothing was sent to a support team.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Feedback Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "idea", label: "💡 Feature Idea" },
                        { id: "bug", label: "🐛 Bug Report" },
                        { id: "other", label: "💬 General" },
                      ].map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setFeedbackType(type.id as typeof feedbackType)}
                          className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                            feedbackType === type.id
                              ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-300"
                              : "bg-[#141822] border-[#222838] text-slate-400 hover:text-white"
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Experience Rating</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className="p-1 text-slate-500 hover:text-amber-400 transition-colors"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= feedbackRating
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-600"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs text-slate-400 ml-2 font-mono">
                        {feedbackRating} / 5 stars
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Your Message</label>
                    <textarea
                      required
                      rows={4}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Describe what you like or what could be improved in the meeting intelligence workflow..."
                      className="w-full p-3 bg-[#171B26] border border-[#262E40] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                  >
                    Submit Feedback
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: Simulated Support */}
          {activeTab === "support" && (
            <div>
              {generatedTicketId ? (
                <div className="p-5 rounded-xl bg-[#141924] border border-emerald-500/30 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">
                        Support Ticket Created
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {generatedTicketId}
                    </span>
                  </div>

                  <div className="p-3 bg-[#0E121B] rounded-lg border border-[#1E2535] text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Topic: {ticketTopic}</span>
                      <span className="text-cyan-400">Status: Investigating</span>
                    </div>
                    <p className="text-slate-300 italic">&ldquo;{ticketMessage}&rdquo;</p>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-2 pt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>
                      Simulated agent assigned: <strong>David Kim (Support Specialist)</strong>. In a live system, you would receive an email confirmation.
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setGeneratedTicketId(null);
                      setTicketMessage("");
                    }}
                    className="text-xs text-cyan-400 hover:underline pt-2 inline-block cursor-pointer"
                  >
                    Submit another support inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSupportTicketSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Support Topic</label>
                    <select
                      value={ticketTopic}
                      onChange={(e) => setTicketTopic(e.target.value)}
                      className="w-full px-3 py-2 bg-[#171B26] border border-[#262E40] rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                    >
                      <option value="Audio & Capture">Audio &amp; Capture</option>
                      <option value="Summary & Action Items">Summary &amp; Action Items</option>
                      <option value="Playlists & Highlights">Playlists &amp; Highlights</option>
                      <option value="Integrations & Calendar">Integrations &amp; Calendar</option>
                      <option value="Other">Other Question</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Inquiry Description
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder="Explain the issue or question with as much detail as possible..."
                      className="w-full p-3 bg-[#171B26] border border-[#262E40] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                  >
                    Create Support Ticket
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
