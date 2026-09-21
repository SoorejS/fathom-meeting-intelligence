import type { Meeting } from "../types/meeting";

const ignored = new Set("what who whom when where why how did does do we they you i me our the a an and or of to in for on with about is are was were say said tell please meeting call happened around owns owner own assigned action items decide decided decisions concern concerns risks risk blockers worries raised summarize summary there any can could participants attended".split(" "));
const tokens = (text: string) => [...new Set((text.toLowerCase().match(/[a-z0-9]+/g) || []).filter(t => !ignored.has(t)).map(t => t.replace(/(ing|s)$/, "")))];
export interface Citation { timestamp: number; formatted: string; text: string }
export interface MeetingAnswer { answer: string; citations: Citation[] }
export function findMeetingAnswer(query: string, meeting: Meeting): MeetingAnswer | undefined {
  const q = query.toLowerCase();
  const transcript = meeting.transcript;
  const cite = (timestamp: number): Citation | undefined => {
    const t = transcript.find(t => t.timestamp === timestamp);
    return t && { timestamp, formatted: t.timestampFormatted, text: `${t.speaker}: ${t.text}` };
  };
  const respond = (answer: string, timestamps: number[]) => {
    const citations = [...new Set(timestamps)].map(cite).filter((c): c is Citation => !!c);
    return citations.length ? { answer, citations } : undefined;
  };
  const time = q.match(/\b(\d{1,3}):([0-5]\d)\b/);
  if (time) {
    const seconds = Number(time[1]) * 60 + Number(time[2]);
    const closest = [...transcript].sort((a,b) => Math.abs(a.timestamp-seconds)-Math.abs(b.timestamp-seconds))[0];
    if (!closest || seconds > meeting.duration || Math.abs(closest.timestamp-seconds) > 45) return undefined;
    return respond(`Nearest recorded excerpt (${closest.timestampFormatted}) — ${closest.speaker}: “${closest.text}”`, [closest.timestamp]);
  }
  const terms = tokens(q);
  const speaker = meeting.participants.find(p => p.name.toLowerCase().split(" ").some(n => n.length > 2 && new RegExp(`\\b${n}\\b`).test(q)));
  const speakerQuestion = /\b(say|said|mention|mentioned)\b/.test(q);
  if (speakerQuestion) {
    if (!speaker) return undefined;
    const topic = terms.filter(t => !tokens(speaker.name).includes(t));
    const excerpts = transcript.filter(t => t.speaker === speaker.name && topic.every(term => tokens(t.text).includes(term)));
    return respond(excerpts.map(t => `${t.speaker}: “${t.text}”`).join("\n\n"), excerpts.map(t => t.timestamp));
  }
  const actionIntent = /\b(action items?|follow.?ups?|owns?|owner|assigned|next steps?)\b/.test(q);
  if (actionIntent) {
    const actions = meeting.actionItems.filter(a => terms.every(term => tokens(a.text + " " + a.owner).includes(term)));
    return respond(actions.map(a => `${a.owner} — ${a.text} (${a.status}${a.dueDate ? `; due ${a.dueDate}` : ""})`).join("\n\n"), actions.map(a => a.sourceTimestamp));
  }
  const score = (text: string, queryTerms = terms) => {
    const words = tokens(text);
    return queryTerms.filter(t => words.includes(t)).length;
  };
  // Summary citations use only excerpts with meaningful lexical overlap. They are
  // labeled related context rather than claiming the excerpt states the summary verbatim.
  const contextFor = (text: string) => [...transcript].sort((a,b) => score(b.text,tokens(text))-score(a.text,tokens(text)))[0];
  if (/\b(decide|decided|decisions)\b/.test(q) && terms.length === 0) {
    const decisions = meeting.summary.default.decisions.map(text => ({ text, source: contextFor(text) })).filter(d => d.source && score(d.source.text,tokens(d.text)) >= 2);
    return respond("Recorded decisions in the summary (citations provide related transcript context):\n\n" + decisions.map(d => d.text).join("\n\n"), decisions.map(d => d.source.timestamp));
  }
  const concern = /\b(concerns?|risks?|blockers?|worries)\b/.test(q);
  const sources = [
    ...transcript.map(t => ({ text: `${t.speaker}: “${t.text}”`, search: t.text + " " + t.speaker, timestamp: t.timestamp, kind: "Transcript" })),
    ...meeting.actionItems.map(a => ({ text: `${a.owner}: ${a.text} (${a.status})`, search: a.text + " " + a.owner, timestamp: a.sourceTimestamp, kind: "Action item" })),
    ...meeting.highlights.map(h => ({ text: h.text, search: h.text + " " + h.type, timestamp: h.timestamp, kind: "Highlight" })),
    ...[meeting.summary.default.overview, ...meeting.summary.default.keyPoints, ...meeting.summary.default.decisions, ...meeting.summary.default.nextSteps].map(text => {
      const source = contextFor(text);
      return { text, search: text, timestamp: source?.timestamp ?? -1, kind: "Summary; related transcript context", supported: !!source && score(source.text,tokens(text)) >= 2 };
    }),
    { text: `${meeting.title}. Participants: ${meeting.participants.map(p => `${p.name} (${p.role})`).join(", ")}.`, search: meeting.title + " " + meeting.participants.map(p => p.name + " " + p.role).join(" "), timestamp: transcript[0]?.timestamp ?? -1, kind: "Meeting details; opening excerpt" },
  ];
  if (/\b(participants|attended)\b/.test(q) && !terms.length) return respond(sources[sources.length-1].text, [transcript[0]?.timestamp]);
  const overview = /\b(summarize|summary)\b/.test(q) && terms.length === 0;
  if (!terms.length && !concern && !overview) return undefined;
  const ranked = sources.filter(s => !("supported" in s) || s.supported).map(s => ({ ...s, score: concern ? (/\b(concern|risk|block|issue|problem|bottleneck|latency|fail|slow)/i.test(s.search) && terms.every(t => tokens(s.search).includes(t)) ? 2 : 0) : overview ? (s.kind.startsWith("Summary") ? 2 : 0) : score(s.search) })).filter(s => s.score >= (concern || overview ? 2 : Math.max(1, Math.ceil(terms.length * .65)))).sort((a,b) => b.score-a.score);
  const selected = ranked.filter((s,i,all) => all.findIndex(other => other.timestamp === s.timestamp) === i).slice(0,3);
  return respond(selected.map(s => `${s.kind}: ${s.text}`).join("\n\n"), selected.map(s => s.timestamp));
}
