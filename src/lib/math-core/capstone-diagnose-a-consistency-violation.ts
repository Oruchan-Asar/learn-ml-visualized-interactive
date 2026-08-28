import { happenedBefore, isConcurrent } from "./causality-and-happened-before";
import { findViolatingOp, isLinearizable, type Op } from "./distributed-consistency-models";

export interface TracedOp extends Op {
  /** This op's vector clock, in [c0, c1, c2] component order — one per client. */
  vc: [number, number, number];
}

/**
 * Same shape of scenario as the consistency-models chapter (3 clients, one key "x"), but now every
 * op also carries a vector clock built the way time-clocks-and-ordering.ts builds one: each op bumps
 * its own client's component, and a read that observes a write's value takes the componentwise max
 * with that write's vector clock (a "read-from" link, standing in for a message).
 *
 * op5 only ever reads-from op1 — never op3 — so causally it only knows about op1. That makes op3 and
 * op5 CONCURRENT under vector clocks (isConcurrent below is true): no message chain tells c1 about
 * op3, so causal consistency alone would never flag anything wrong here. But by wall-clock time op3
 * finished (t=7) well before op5 started (t=10), so linearizability's real-time rule still requires
 * op5 to see op3's value — and it doesn't. That gap is the whole point of this capstone: a
 * linearizability violation doesn't have to be a causality violation too.
 */
export const TRACE: TracedOp[] = [
  { id: "op1", client: "c0", type: "write", key: "x", value: 1, start: 0, end: 2, vc: [1, 0, 0] },
  { id: "op2", client: "c1", type: "read", key: "x", value: 1, start: 3, end: 4, vc: [1, 1, 0] },
  { id: "op3", client: "c0", type: "write", key: "x", value: 2, start: 5, end: 7, vc: [2, 0, 0] },
  { id: "op4", client: "c2", type: "read", key: "x", value: 2, start: 8, end: 9, vc: [2, 0, 1] },
  { id: "op5", client: "c1", type: "read", key: "x", value: 1, start: 10, end: 11, vc: [1, 2, 0] },
];

/** Reuses the exact linearizability checker from the consistency-models chapter. */
export function isTraceLinearizable(trace: TracedOp[] = TRACE): boolean {
  return isLinearizable(trace);
}

/** Reuses the exact single-culprit diagnosis from the consistency-models chapter. */
export function diagnoseViolation(trace: TracedOp[] = TRACE): TracedOp | null {
  return findViolatingOp(trace) as TracedOp | null;
}

/**
 * The causality angle on the same diagnosed op: is it merely concurrent (per vector clocks) with the
 * write it should have seen, rather than causally dependent on it? True here — which is exactly why a
 * causal-consistency checker would have waved this trace through.
 */
export function isViolationMerelyConcurrent(
  violatingOp: TracedOp,
  missedWrite: TracedOp,
): boolean {
  return isConcurrent(violatingOp.vc, missedWrite.vc);
}

/** The write that causally happened-before the violating op yet whose value it failed to reflect. */
export function findCausallyPriorWrite(trace: TracedOp[], violatingOp: TracedOp): TracedOp | null {
  const priorWrites = trace.filter(
    (o): o is TracedOp => o.type === "write" && o.id !== violatingOp.id && happenedBefore(o.vc, violatingOp.vc),
  );
  if (priorWrites.length === 0) return null;
  return priorWrites.reduce((latest, w) => (happenedBefore(latest.vc, w.vc) ? w : latest));
}

/** The write with the latest real-time end that finished before the violating op started — the value it SHOULD have seen. */
export function findRealTimePriorWrite(trace: TracedOp[], violatingOp: TracedOp): TracedOp | null {
  const priorWrites = trace.filter(
    (o) => o.type === "write" && o.id !== violatingOp.id && o.end <= violatingOp.start,
  );
  if (priorWrites.length === 0) return null;
  return priorWrites.reduce((latest, w) => (w.end > latest.end ? w : latest));
}
