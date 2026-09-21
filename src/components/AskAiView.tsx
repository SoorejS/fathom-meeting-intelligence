"use client";

import React, { useState, useRef, useEffect } from "react";
import { findMeetingAnswer } from "@/lib/meetingAnswers";
import { Meeting } from "@/types/meeting";
import { Sparkles, Play, RefreshCw, ArrowUp } from "lucide-react";

interface AskAiViewProps {
  meeting: Meeting;
  onSeek: (seconds: number) => void;
}

interface Message {
  id: string;
  sender: "user" | "fathom";
  text: string;
  citations?: { timestamp: number; formatted: string; text: string }[];
}

export const AskAiView: React.FC<AskAiViewProps> = ({ meeting, onSeek }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg_init",
      sender: "fathom",
      text: `Ask about ${meeting.title}. Answers retrieve this meeting’s notes and transcript excerpts, with sources you can open.`,
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = ["What did we decide?", "What are the action items?", "What concerns were raised?", "Who attended?"];
  const responseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageSequence = useRef(0);
  useEffect(() => () => { if (responseTimer.current) clearTimeout(responseTimer.current); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleAsk = (query: string) => {
    const q = query.trim();
    if (!q || isTyping) return;

    const userMsg: Message = {
      id: `u_${++messageSequence.current}`,
      sender: "user",
      text: q,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsTyping(true);

    responseTimer.current = setTimeout(() => {
      const matched = findMeetingAnswer(q, meeting);
      const answerText = matched?.answer || "This meeting does not contain enough information to answer that question. Try a specific topic, participant, or timestamp from its transcript.";

      const aiMsg: Message = {
        id: `f_${++messageSequence.current}`,
        sender: "fathom",
        text: answerText,
        citations: matched?.citations,
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
            • Meeting notes & transcript sources
          </span>
        </div>

        <button
          onClick={() => {
            if (responseTimer.current) clearTimeout(responseTimer.current);
            setIsTyping(false);
            setMessages([
              {
                id: "msg_init_reset",
                sender: "fathom",
                text: `Conversation reset. Ask any question about this meeting.`,
              },
            ]);
          }}
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
                <p className="whitespace-pre-line">{m.text}</p>

                {m.citations?.map(citation => <button key={citation.timestamp} onClick={() => onSeek(citation.timestamp)} title={citation.text} className="inline-flex items-center gap-1 mr-2 text-cyan-400 border border-cyan-400/30 rounded px-2 py-1">
                  <Play className="w-3 h-3" /> Source {citation.formatted}
                </button>)}

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
            disabled={isTyping}
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
