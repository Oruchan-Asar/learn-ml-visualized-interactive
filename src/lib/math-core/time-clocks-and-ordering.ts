export type EventKind = "internal" | "send" | "receive";

export interface RawEvent {
  id: string;
  /** Index into PROCESS_NAMES. */
  process: number;
  kind: EventKind;
  /** Links a "send" to its matching "receive". */
  messageId?: string;
  /** Short human-readable description for the UI. */
  label: string;
}

export const PROCESS_NAMES = ["P0", "P1", "P2"];

/**
 * A fixed 9-event trace across 3 processes, forming a message cycle P0 -> P1 -> P2 -> P0 (m1, m2, m3).
 * Listed in a valid causal order: every "receive" appears after the "send" it matches, so a single
 * left-to-right pass is enough to compute both clocks correctly.
 */
export const EVENTS: RawEvent[] = [
  { id: "e1", process: 0, kind: "internal", label: "P0 does local work" },
  { id: "e2", process: 0, kind: "send", messageId: "m1", label: "P0 sends m1 to P1" },
  { id: "e3", process: 0, kind: "internal", label: "P0 does more local work" },
  { id: "e4", process: 1, kind: "receive", messageId: "m1", label: "P1 receives m1" },
  { id: "e5", process: 1, kind: "send", messageId: "m2", label: "P1 sends m2 to P2" },
  { id: "e6", process: 2, kind: "internal", label: "P2 does local work" },
  { id: "e7", process: 2, kind: "receive", messageId: "m2", label: "P2 receives m2" },
  { id: "e8", process: 2, kind: "send", messageId: "m3", label: "P2 sends m3 to P0" },
  { id: "e9", process: 0, kind: "receive", messageId: "m3", label: "P0 receives m3" },
];

/**
 * Lamport's rule: every event bumps its own process's counter by one; a receive first jumps to
 * max(own counter, sender's stamped counter) before bumping. Gives every event a single integer, but
 * two integers being different never proves one event caused the other (see causality-and-happened-before.ts).
 */
export function computeLamportTimestamps(events: RawEvent[] = EVENTS): Record<string, number> {
  const clock: number[] = PROCESS_NAMES.map(() => 0);
  const sendTimestamp: Record<string, number> = {};
  const result: Record<string, number> = {};
  for (const e of events) {
    if (e.kind === "receive" && e.messageId) {
      const senderTs = sendTimestamp[e.messageId] ?? 0;
      clock[e.process] = Math.max(clock[e.process], senderTs) + 1;
    } else {
      clock[e.process] += 1;
    }
    result[e.id] = clock[e.process];
    if (e.kind === "send" && e.messageId) sendTimestamp[e.messageId] = clock[e.process];
  }
  return result;
}

/**
 * A vector clock's rule: bump only your own component, but a receive first takes the componentwise
 * max with the sender's stamped vector. Unlike a Lamport timestamp, the full vector is attached to
 * every message so a receiver can recover exactly what the sender had already seen.
 */
export function computeVectorClocks(events: RawEvent[] = EVENTS): Record<string, number[]> {
  const vc: number[][] = PROCESS_NAMES.map(() => PROCESS_NAMES.map(() => 0));
  const sendVC: Record<string, number[]> = {};
  const result: Record<string, number[]> = {};
  for (const e of events) {
    if (e.kind === "receive" && e.messageId) {
      const incoming = sendVC[e.messageId] ?? PROCESS_NAMES.map(() => 0);
      vc[e.process] = vc[e.process].map((v, i) => Math.max(v, incoming[i]));
    }
    vc[e.process] = vc[e.process].map((v, i) => (i === e.process ? v + 1 : v));
    result[e.id] = [...vc[e.process]];
    if (e.kind === "send" && e.messageId) sendVC[e.messageId] = [...vc[e.process]];
  }
  return result;
}

export type ClockRelation = "before" | "after" | "concurrent" | "equal";

/**
 * The vector-clock comparison rule: a <= b componentwise means a "happened-before" b. If neither
 * vector dominates the other, the two events are genuinely concurrent — no message chain links them.
 */
export function compareVectorClocks(a: number[], b: number[]): ClockRelation {
  let aLessEq = true;
  let bLessEq = true;
  for (let i = 0; i < a.length; i++) {
    if (a[i] > b[i]) aLessEq = false;
    if (b[i] > a[i]) bLessEq = false;
  }
  if (aLessEq && bLessEq) return "equal";
  if (aLessEq) return "before";
  if (bLessEq) return "after";
  return "concurrent";
}

export const LAMPORT_TIMESTAMPS = computeLamportTimestamps(EVENTS);
export const VECTOR_CLOCKS = computeVectorClocks(EVENTS);
