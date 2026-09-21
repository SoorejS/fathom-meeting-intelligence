import type { AiQnAItem } from "../types/meeting";

// Conservative retrieval from this meeting only. Unsupported queries get no answer.
export function findMeetingAnswer(query: string, answers: AiQnAItem[]) {
  const normalized = query.trim().toLowerCase();
  const exact = answers.find((item) => item.question.toLowerCase() === normalized);
  if (exact) return exact;
  const ignored = new Set(["what", "were", "was", "the", "did", "we", "are", "is", "a", "an", "about", "and", "of", "to", "in", "for", "how", "with"]);
  const words = (text: string) => text.toLowerCase().match(/[a-z0-9]+/g)?.filter((word) => !ignored.has(word)) || [];
  const queryWords = words(normalized);
  const scored = answers.map((item) => {
    const terms = words(item.question);
    const shared = terms.filter((word) => queryWords.includes(word)).length;
    return { item, score: shared >= 2 ? shared / Math.max(terms.length, queryWords.length) : 0 };
  }).sort((a, b) => b.score - a.score);
  return scored[0]?.score >= 0.6 ? scored[0].item : undefined;
}
