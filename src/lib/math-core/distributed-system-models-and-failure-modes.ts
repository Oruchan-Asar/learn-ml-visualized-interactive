export interface Message {
  id: string;
  from: string;
  to: string;
  sentAt: number;
  /** null means the message never arrives at all. */
  deliveredAt: number | null;
}

export const NODES = ["A", "B", "C", "D"];

/** One round of nodes messaging each other, with genuinely different delays — no delivery ever dropped. */
export const MESSAGES: Message[] = [
  { id: "m1", from: "A", to: "B", sentAt: 0, deliveredAt: 2 },
  { id: "m2", from: "A", to: "C", sentAt: 0, deliveredAt: 9 },
  { id: "m3", from: "A", to: "D", sentAt: 0, deliveredAt: 3 },
  { id: "m4", from: "B", to: "A", sentAt: 1, deliveredAt: 4 },
  { id: "m5", from: "C", to: "B", sentAt: 1, deliveredAt: 6 },
  { id: "m6", from: "C", to: "D", sentAt: 2, deliveredAt: 5 },
];

export function messageDelay(m: Message): number | null {
  return m.deliveredAt === null ? null : m.deliveredAt - m.sentAt;
}

/** The synchronous model's defining promise: EVERY message arrives within a known bound delta. */
export function isSynchronousUnderBound(messages: Message[], delta: number): boolean {
  return messages.every((m) => {
    const d = messageDelay(m);
    return d !== null && d <= delta;
  });
}

/** The smallest delta for which the synchronous model actually holds — null if any message never arrives at all. */
export function minimumSynchronousBound(messages: Message[]): number | null {
  const delays = messages.map(messageDelay);
  if (delays.some((d) => d === null)) return null;
  return Math.max(...(delays as number[]));
}

export type FailureMode = "correct" | "crash" | "omission" | "byzantine";

export interface NodeRoundLog {
  node: string;
  /** What this node was supposed to send each peer this round. */
  expected: Record<string, number>;
  /** What it actually sent each peer — a missing key means that peer got nothing at all. */
  actual: Record<string, number | undefined>;
}

/**
 * A crashed node sends nothing further; an omission-faulty node sends the right value to some peers
 * and silently drops it for others; a Byzantine node tells different peers conflicting things (or
 * lies to everyone consistently) — anything reachable that isn't one of those is behaving correctly.
 */
export function classifyFailure(log: NodeRoundLog): FailureMode {
  const peers = Object.keys(log.expected);
  const sent = peers.map((p) => log.actual[p]);
  const sentCount = sent.filter((v) => v !== undefined).length;
  if (sentCount === 0) return "crash";

  const distinctValues = new Set(sent.filter((v): v is number => v !== undefined));
  if (distinctValues.size > 1) return "byzantine";

  const [onlyValue] = distinctValues;
  const expectedValue = log.expected[peers[0]];
  if (onlyValue !== expectedValue) return "byzantine";
  if (sentCount < peers.length) return "omission";
  return "correct";
}

/** A: correct. B: crashed (sent nothing). C: omission (dropped just one message). D: Byzantine (told B a different value than everyone else). */
export const ROUND_LOGS: NodeRoundLog[] = [
  { node: "A", expected: { B: 1, C: 1, D: 1 }, actual: { B: 1, C: 1, D: 1 } },
  { node: "B", expected: { A: 2, C: 2, D: 2 }, actual: {} },
  { node: "C", expected: { A: 3, B: 3, D: 3 }, actual: { A: 3, B: 3 } },
  { node: "D", expected: { A: 4, B: 4, C: 4 }, actual: { A: 4, B: 5, C: 4 } },
];
