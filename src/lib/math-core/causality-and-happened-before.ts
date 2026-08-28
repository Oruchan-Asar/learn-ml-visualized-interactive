import {
  EVENTS,
  LAMPORT_TIMESTAMPS,
  VECTOR_CLOCKS,
  compareVectorClocks,
  type RawEvent,
} from "./time-clocks-and-ordering";

export { EVENTS, LAMPORT_TIMESTAMPS, VECTOR_CLOCKS };
export type { RawEvent };

/** a "happened-before" b: a's vector clock is componentwise <= b's, and the two aren't equal. */
export function happenedBefore(a: number[], b: number[]): boolean {
  return compareVectorClocks(a, b) === "before";
}

/** Neither event's vector clock dominates the other — no chain of messages links them either way. */
export function isConcurrent(a: number[], b: number[]): boolean {
  return compareVectorClocks(a, b) === "concurrent";
}

/** Same checks, but looked up by event id against this chapter's fixed EVENTS trace. */
export function eventHappenedBefore(idA: string, idB: string): boolean {
  return happenedBefore(VECTOR_CLOCKS[idA], VECTOR_CLOCKS[idB]);
}

export function eventsAreConcurrent(idA: string, idB: string): boolean {
  return isConcurrent(VECTOR_CLOCKS[idA], VECTOR_CLOCKS[idB]);
}

/**
 * Lamport timestamps give every event a number, so any two events can always be compared — but that
 * total order is partly fiction. This is true exactly when two events are genuinely concurrent (no
 * causal path between them) yet still received different Lamport numbers, which a scalar clock cannot
 * help but hand out to *every* pair, causal or not.
 */
export function lamportFalselyOrders(idA: string, idB: string): boolean {
  return eventsAreConcurrent(idA, idB) && LAMPORT_TIMESTAMPS[idA] !== LAMPORT_TIMESTAMPS[idB];
}
