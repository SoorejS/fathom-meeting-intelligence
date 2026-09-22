interface FAQItem {
  question: string;
  category: "notetaker" | "playlists" | "trackers" | "summaries";
  answer: string;
}

export const FAQS: FAQItem[] = [
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
      "Playlists allow you to curate key highlights and video moments across multiple meetings into a simulated reel preview. Navigate to the Playlists tab or use '+ Add to Playlist' on any highlight in a meeting.",
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
      "Yes. In any meeting detail view, choose Enhanced, Executive Brief, Sales & Deals, or Engineering Spec. You can also configure the default template in Settings > Default Meeting Summary Template.",
  },
];

const ignored = new Set(["how", "does", "work", "what", "with", "this", "that", "have", "from", "help", "please", "can", "the", "are", "about", "your"]);
export function answerSupportQuestion(query: string): string {
  const words = [...new Set((query.toLowerCase().match(/[a-z]{3,}/g) || []).filter(word => !ignored.has(word)))];
  const matches = FAQS.map(faq => ({faq, score: words.reduce((score, word) => score + (faq.question.toLowerCase().includes(word) ? 3 : 0) + (faq.answer.toLowerCase().includes(word) ? 1 : 0), 0)})).sort((a,b) => b.score-a.score);
  return matches[0]?.score ? matches[0].faq.answer : "I can help with recording, microphone privacy, playlists, trackers, and summary templates. Choose Help center to browse the articles.";
}
