"use client";

import { FAQS, answerSupportQuestion } from "@/lib/supportAnswers";
import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Search,
  BookOpen,
  MessageSquare,
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

type HelpTab = "conversation" | "ai" | "docs" | "feedback" | "support";

export const HelpFeedbackModal: React.FC<HelpFeedbackModalProps> = ({
  isOpen,
  onClose,
  onOpenTestCall,
}) => {
  const [activeTab, setActiveTab] = useState<HelpTab>("conversation");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  const [aiQuery, setAiQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");

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
      aria-label="Help and feedback"
      className="support-widget"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="flex flex-col min-h-0 h-full overflow-hidden">
        <div className="px-5 py-5 flex items-center justify-between shrink-0"><div className="flex items-center gap-3"><Sparkles size={25} className="text-cyan-500"/><div><h2 className="font-semibold text-base">Fathom Support</h2><p className="text-xs text-slate-500">We&apos;re here to help!</p></div></div><button onClick={onClose} aria-label="Close help" className="p-2 text-slate-500 hover:text-black"><ChevronDown size={22}/></button></div>
        {/* Modal Body */}
        <div className="px-5 pb-5 overflow-y-auto flex-1 min-h-0 space-y-6">
          {activeTab === "conversation" && <div className="pt-4"><p className="text-xs text-slate-500 mb-2">Fathom Support Bot</p><p className="text-base">Hey there 👋 How can we help you today?</p><div className="flex flex-col items-end gap-3 mt-6"><button onClick={() => setActiveTab("ai")} className="support-choice">🤖 Ask AI - INSTANT</button><button onClick={() => setActiveTab("support")} className="support-choice">✉️ Open a Ticket</button><button onClick={() => setActiveTab("feedback")} className="support-choice">💡 Share Feedback</button></div></div>}
          {activeTab !== "conversation" && activeTab !== "docs" && <button className="flex items-center gap-1 text-xs text-slate-500" onClick={() => setActiveTab("conversation")}><ArrowLeft size={14}/>Conversation</button>}
          {activeTab === "ai" && <div className="space-y-4"><h3 className="font-semibold">Ask AI</h3><p className="text-sm text-slate-500">Answers from this demo&apos;s help articles.</p><form onSubmit={e => {e.preventDefault();setAiAnswer(answerSupportQuestion(aiQuery));}} className="space-y-3"><input aria-label="Ask support AI" value={aiQuery} onChange={e => setAiQuery(e.target.value)} placeholder="How do I create a playlist?" className="w-full rounded-lg border border-slate-200 p-3 text-sm"/><button disabled={!aiQuery.trim()} className="support-choice disabled:opacity-40">Ask question</button></form>{aiAnswer && <p role="status" className="text-sm leading-relaxed bg-slate-50 rounded-lg p-4">{aiAnswer}</p>}</div>}
          {/* TAB 1: Documentation & FAQ */}
          {activeTab === "docs" && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles and FAQs..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Quick Feature Cards */}
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold">
                    <Bot className="w-3.5 h-3.5" />
                    <span>Practice Call</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
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

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-400 text-xs font-semibold">
                    <ListMusic className="w-3.5 h-3.5" />
                    <span>Highlight Reels</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Collect important takeaways in a timed, simulated reel preview.
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
                    <Bell className="w-3.5 h-3.5" />
                    <span>Keyword Alerts</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Scan transcripts for pricing, objections, or project milestones.
                  </p>
                </div>
              </div>

              {/* Accordion FAQ List */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Frequently Asked Questions
                </h3>
                {filteredFaqs.map((faq, idx) => {
                  const isExpanded = expandedFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="border border-slate-200 bg-white rounded-xl overflow-hidden transition-colors"
                    >
                      <button
                        onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-semibold text-slate-900 hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        <span>{faq.question}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                            isExpanded ? "rotate-180 text-cyan-400" : ""
                          }`}
                        />
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-3 text-xs text-slate-700 leading-relaxed border-t border-slate-200 pt-2">
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
                  <h4 className="text-sm font-bold text-slate-900">Thank You for Your Feedback!</h4>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Demo feedback acknowledged for this session only. Nothing was sent to a support team.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Feedback Type</label>
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
                              : "bg-white border-slate-200 text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Experience Rating</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          aria-label={star + " stars"}
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
                      <span className="text-xs text-slate-500 ml-2 font-mono">
                        {feedbackRating} / 5 stars
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Your Message</label>
                    <textarea
                      required
                      rows={4}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Describe what you like or what could be improved in the meeting intelligence workflow..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 resize-none"
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
                <div className="p-5 rounded-xl bg-white border border-emerald-500/30 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-slate-900">
                        Demo Ticket Preview
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {generatedTicketId}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>Topic: {ticketTopic}</span>
                      <span className="text-cyan-400">Status: Not sent</span>
                    </div>
                    <p className="text-slate-700 italic">&ldquo;{ticketMessage}&rdquo;</p>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-2 pt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>
                      This ticket is a local preview only. Nothing was sent and no support agent has been assigned.
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
                    <label className="text-xs font-semibold text-slate-700">Support Topic</label>
                    <select
                      value={ticketTopic}
                      onChange={(e) => setTicketTopic(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                    >
                      <option value="Audio & Capture">Audio &amp; Capture</option>
                      <option value="Summary & Action Items">Summary &amp; Action Items</option>
                      <option value="Playlists & Highlights">Playlists &amp; Highlights</option>
                      <option value="Integrations & Calendar">Integrations &amp; Calendar</option>
                      <option value="Other">Other Question</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Inquiry Description
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder="Explain the issue or question with as much detail as possible..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 resize-none"
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
        <nav aria-label="Support" className="support-nav"><button aria-pressed={activeTab !== "docs"} onClick={() => setActiveTab("conversation")}><MessageSquare size={17}/>Conversation</button><button aria-pressed={activeTab === "docs"} onClick={() => setActiveTab("docs")}><BookOpen size={17}/>Help center</button></nav>
      </div>
    </div>
  );
};
