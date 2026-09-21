"use client";

import React, { useState, useRef, useEffect } from "react";
import { AiQnAItem } from "@/types/meeting";
import { Sparkles, Play, RefreshCw, ArrowUp, Bot, User } from "lucide-react";

interface AskAiViewProps {
  aiQnA: AiQnAItem[];
  onSeek: (seconds: number) => void;
  meetingTitle: string;
}

interface Message {
  id: string;
  sender: "user" | "fathom";
  text: string;
  citationTimestamp?: number;
  citationFormatted?: string;
  contextSnippet?: string;
}

export const AskAiView: React.FC<AskAiViewProps> = ({ aiQnA, onSeek, meetingTitle }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg_init",
      sender: "fathom",
      text: `I've analyzed this entire call (${meetingTitle}). Ask me anything about decisions, action items, speaker quotes, or specific discussions.`,
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "Things I promised I'd do by this week",
    "What were the key decisions made?",
    "What concerns were raised?",
    "Summarize the next steps",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleAsk = (query: string) => {
    const q = query.trim();
    if (!q) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      sender: "user",
      text: q,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsTyping(true);

    setTimeout(() => {
      const normalizedQ = q.toLowerCase();
      let matched = aiQnA.find(
        (item) =>
          normalizedQ.includes(item.question.toLowerCase().slice(0, 15)) ||
          item.question.toLowerCase().includes(normalizedQ.slice(0, 15))
      );

      if (!matched) {
        if (
          normalizedQ.includes("promised") ||
          normalizedQ.includes("action") ||
          normalizedQ.includes("step")
        ) {
          matched = aiQnA.find((item) => item.question.toLowerCase().includes("action"));
        } else if (
          normalizedQ.includes("decide") ||
          normalizedQ.includes("decision") ||
          normalizedQ.includes("launch")
        ) {
          matched = aiQnA.find((item) => item.question.toLowerCase().includes("decide"));
        } else if (normalizedQ.includes("concern") || normalizedQ.includes("client")) {
          matched = aiQnA.find((item) => item.question.toLowerCase().includes("concern"));
        } else {
          matched = aiQnA[0];
        }
      }

      const answerText = matched
        ? matched.answer
        : `Based on the transcript analysis for this call, participants aligned on timeline deliverables, resolved system bottlenecks, and finalized next milestones.`;

      const aiMsg: Message = {
        id: `f_${Date.now()}`,
        sender: "fathom",
        text: answerText,
        citationTimestamp: matched?.citationTimestamp,
        citationFormatted: matched?.citationFormatted,
        contextSnippet: matched?.contextSnippet,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pt-1 select-none">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#00c2ff]" />
          <span className="text-xs font-bold text-white tracking-wider">
            ASK FATHOM AI
          </span>
          <span className="text-[10px] text-slate-400">
            • Grounded in synchronized transcript
          </span>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: "msg_init_reset",
                sender: "fathom",
                text: `Conversation reset. Ask any question about this meeting.`,
              },
            ])
          }
          className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
          title="Reset conversation"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
        {messages.map((m) => {
          const isFathom = m.sender === "fathom";
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${isFathom ? "justify-start" : "justify-end"}`}
            >
              {isFathom && (
                <div className="w-6 h-6 rounded-md bg-[#00c2ff]/20 border border-[#00c2ff]/30 flex items-center justify-center text-[#00c2ff] shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl p-3 space-y-2 text-xs leading-relaxed ${
                  isFathom
                    ? "bg-[#161820] border border-[#242734] text-slate-200"
                    : "bg-[#00c2ff] text-black font-semibold rounded-br-none shadow-md"
                }`}
              >
                <p>{m.text}</p>

                {/* Grounded Citation Timestamp */}
                {m.citationTimestamp !== undefined && m.citationFormatted && (
                  <div className="pt-2 border-t border-[#232733] flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-normal">
                      Referenced from transcript:
                    </span>
                    <button
                      onClick={() => onSeek(m.citationTimestamp!)}
                      className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#00c2ff] hover:text-white bg-[#00c2ff]/10 hover:bg-[#00c2ff]/20 px-2 py-0.5 rounded border border-[#00c2ff]/30 transition-colors cursor-pointer"
                      title="Jump playback to cited timestamp"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>{m.citationFormatted}</span>
                    </button>
                  </div>
                )}
              </div>

              {!isFathom && (
                <div className="w-6 h-6 rounded-full bg-[#272b38] flex items-center justify-center text-slate-300 text-[9px] font-bold shrink-0 mt-0.5">
                  YOU
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-xs pl-8">
            <span className="w-2 h-2 rounded-full bg-[#00c2ff] animate-pulse" />
            <span>Fathom AI is reviewing transcript...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="pt-2 border-t border-[#1c1f26] flex items-center gap-1.5 overflow-x-auto select-none">
        {suggestedQuestions.map((sq, i) => (
          <button
            key={i}
            onClick={() => handleAsk(sq)}
            className="px-2.5 py-1 rounded-full bg-[#161820] hover:bg-[#20232d] border border-[#262a37] text-[11px] text-slate-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Input Box Card */}
      <div className="p-2.5 bg-[#161820] border border-[#242734] focus-within:border-[#00c2ff]/50 rounded-xl transition-colors">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(inputQuery);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask anything about this call..."
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none px-1"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isTyping}
            className="w-7 h-7 rounded-full bg-[#242834] hover:bg-[#00c2ff] hover:text-black text-white flex items-center justify-center disabled:opacity-30 transition-colors cursor-pointer"
            title="Send query"
          >
            <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </form>
      </div>
    </div>
  );
};
