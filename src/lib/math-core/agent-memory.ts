/**
 * A context window is fixed-size — as a conversation grows, the oldest messages fall out to make room
 * for new ones, exactly like a FIFO queue. A fact stated early on is gone from the window the moment
 * enough new messages arrive, whether or not it turns out to matter later. Retrieval sidesteps the whole
 * problem by keeping every message in an external store the window's size limit never touches.
 */
export interface Message {
  id: number;
  text: string;
}

export const CONTEXT_WINDOW_SIZE = 4;

export const MESSAGES: Message[] = [
  { id: 0, text: "My favorite color is teal." },
  { id: 1, text: "What's the weather like today?" },
  { id: 2, text: "Can you help me plan a trip?" },
  { id: 3, text: "I'm thinking of visiting Japan." },
  { id: 4, text: "What's a good time of year to go?" },
  { id: 5, text: "Spring, for cherry blossoms." },
  { id: 6, text: "What's my favorite color?" },
];

export const QUERY_INDEX = 6;

/** The last `windowSize` messages up to and including index t — everything older has already fallen out. */
export function contextWindowAt(t: number, windowSize: number = CONTEXT_WINDOW_SIZE): Message[] {
  return MESSAGES.slice(Math.max(0, t - windowSize + 1), t + 1);
}

export function inContextWindow(messageId: number, t: number, windowSize: number = CONTEXT_WINDOW_SIZE): boolean {
  return contextWindowAt(t, windowSize).some((m) => m.id === messageId);
}

function keywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3),
  );
}

/** Shared-keyword overlap between a query and a candidate message — the simplest possible retrieval score. */
export function overlapScore(query: string, candidate: string): number {
  const queryWords = keywords(query);
  const candidateWords = keywords(candidate);
  let count = 0;
  for (const w of queryWords) if (candidateWords.has(w)) count++;
  return count;
}

/** Retrieves the best-matching message from everything strictly before `beforeIndex` — an external store the context window's eviction never touches. */
export function retrieve(query: string, beforeIndex: number = QUERY_INDEX): Message {
  const candidates = MESSAGES.slice(0, beforeIndex);
  let best = candidates[0];
  let bestScore = -1;
  for (const m of candidates) {
    const score = overlapScore(query, m.text);
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}
