// NOTE ON THE FILENAME: this chapter's slug is "consistency-models", but src/lib/math-core is a flat,
// shared namespace across every course in the repo, and an unrelated ML chapter (Part 16, diffusion
// consistency models) already owns math-core/consistency-models.ts and tests/formulas/consistency-models.test.ts.
// Using the bare slug here would silently overwrite that chapter's implementation, so this file (and its
// test) are named distributed-consistency-models.ts instead. The content directory, route, and CONCEPT_ID
// still use the plain "consistency-models" slug, per the chapter pipeline.

export interface Op {
  id: string;
  /** Which client/session issued this operation — used to check per-process program order. */
  client: string;
  type: "read" | "write";
  key: string;
  value: number;
  /** Wall-clock interval the operation was outstanding for. */
  start: number;
  end: number;
}

/**
 * A single key "x", 3 clients, 5 operations with disjoint real-time intervals — so real time alone
 * already imposes one candidate total order. op5 is the trap: by the time it starts (t=10), op3's
 * write of x=2 finished (t=7), so op5 must see 2 — but it returns the stale value 1.
 */
export const HISTORY: Op[] = [
  { id: "op1", client: "c0", type: "write", key: "x", value: 1, start: 0, end: 2 },
  { id: "op2", client: "c1", type: "read", key: "x", value: 1, start: 3, end: 4 },
  { id: "op3", client: "c0", type: "write", key: "x", value: 2, start: 5, end: 7 },
  { id: "op4", client: "c2", type: "read", key: "x", value: 2, start: 8, end: 9 },
  { id: "op5", client: "c1", type: "read", key: "x", value: 1, start: 10, end: 11 },
];

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  const result: T[][] = [];
  for (let i = 0; i < items.length; i++) {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const p of permutations(rest)) result.push([items[i], ...p]);
  }
  return result;
}

/** a is definitely-before b in real time if a's interval ends before b's even starts (no overlap). */
export function definitelyBefore(a: Op, b: Op): boolean {
  return a.end <= b.start;
}

/** Replaying `order`: every read must return the value of the most recent preceding write to its key. */
export function isValidSequential(order: Op[]): boolean {
  const latest = new Map<string, number>();
  for (const op of order) {
    if (op.type === "write") {
      latest.set(op.key, op.value);
    } else if (latest.get(op.key) !== op.value) {
      return false;
    }
  }
  return true;
}

/** Does `order` (a permutation of `original`) preserve every definitely-before pair from real time? */
export function respectsRealTimeOrder(order: Op[], original: Op[] = HISTORY): boolean {
  const pos = new Map(order.map((op, i) => [op.id, i]));
  for (const a of original) {
    for (const b of original) {
      if (a.id !== b.id && definitelyBefore(a, b) && pos.get(a.id)! > pos.get(b.id)!) return false;
    }
  }
  return true;
}

/** Linearizability: does SOME valid replay order exist that also respects every real-time constraint? */
export function findLinearization(history: Op[] = HISTORY): Op[] | null {
  for (const order of permutations(history)) {
    if (respectsRealTimeOrder(order, history) && isValidSequential(order)) return order;
  }
  return null;
}

export function isLinearizable(history: Op[] = HISTORY): boolean {
  return findLinearization(history) !== null;
}

/**
 * Diagnoses which single operation breaks linearizability: remove one op at a time and check whether
 * the rest becomes linearizable. Built for a trace with exactly one culprit — the toy scenarios this
 * course uses throughout.
 */
export function findViolatingOp(history: Op[] = HISTORY): Op | null {
  if (isLinearizable(history)) return null;
  for (const op of history) {
    const without = history.filter((o) => o.id !== op.id);
    if (isLinearizable(without)) return op;
  }
  return null;
}

/** Does `order` (a permutation of `original`) preserve each client's own program order? */
export function respectsProgramOrder(order: Op[], original: Op[] = HISTORY): boolean {
  const clients = new Set(original.map((o) => o.client));
  for (const client of clients) {
    const origSeq = original.filter((o) => o.client === client).map((o) => o.id).join(",");
    const orderSeq = order.filter((o) => o.client === client).map((o) => o.id).join(",");
    if (origSeq !== orderSeq) return false;
  }
  return true;
}

/**
 * Sequential consistency: strictly weaker than linearizability — it drops the real-time constraint
 * entirely, only requiring SOME global total order that respects each client's own program order.
 * HISTORY fails linearizability but passes this: reordering op5 to run right after op2 (before op3's
 * write) satisfies every client's program order and every read matches the most recent write in that order.
 */
export function isSequentiallyConsistent(history: Op[] = HISTORY): boolean {
  for (const order of permutations(history)) {
    if (respectsProgramOrder(order, history) && isValidSequential(order)) return true;
  }
  return false;
}

export interface CausalWrite {
  id: string;
  value: number;
  /** Ids of writes this one causally depends on (e.g. this client read them before writing). */
  dependsOn: string[];
}

/** w1 and w3 are concurrent (no dependency either way); w2 causally depends on w1. */
export const CAUSAL_WRITES: CausalWrite[] = [
  { id: "w1", value: 1, dependsOn: [] },
  { id: "w2", value: 2, dependsOn: ["w1"] },
  { id: "w3", value: 3, dependsOn: [] },
];

export const CAUSAL_VIEW_R1 = ["w1", "w3", "w2"];
export const CAUSAL_VIEW_R2 = ["w3", "w1", "w2"];
export const CAUSAL_VIEW_BAD = ["w2", "w1", "w3"];

/**
 * Causal consistency: a replica's applied-order view is valid as long as every write appears after
 * everything it depends on. Concurrent writes (like w1, w3) can land in a different relative order on
 * different replicas — R1 and R2 disagree on w1-vs-w3 order and are BOTH still valid.
 */
export function respectsCausalOrder(view: string[], writes: CausalWrite[] = CAUSAL_WRITES): boolean {
  const pos = new Map(view.map((id, i) => [id, i]));
  const byId = new Map(writes.map((w) => [w.id, w]));
  for (const id of view) {
    const w = byId.get(id);
    if (!w) continue;
    for (const dep of w.dependsOn) {
      if (pos.has(dep) && pos.get(dep)! > pos.get(id)!) return false;
    }
  }
  return true;
}

export interface TimestampedWrite {
  id: string;
  ts: number;
  value: number;
}

export const LWW_WRITES: TimestampedWrite[] = [
  { id: "u1", ts: 2, value: 5 },
  { id: "u2", ts: 1, value: 9 },
  { id: "u3", ts: 3, value: 7 },
];

/** Last-writer-wins: whichever write has the highest timestamp wins, independent of application order. */
export function applyLastWriterWins(writes: TimestampedWrite[]): number {
  return writes.reduce((latest, w) => (w.ts > latest.ts ? w : latest)).value;
}

/**
 * Eventual consistency's one real guarantee: given the same set of writes, every possible delivery
 * order converges to the same final value (here, via last-writer-wins) — with no ordering promise
 * along the way.
 */
export function convergesRegardlessOfOrder(writes: TimestampedWrite[] = LWW_WRITES): boolean {
  const finalValues = permutations(writes).map((order) => applyLastWriterWins(order));
  return new Set(finalValues).size === 1;
}
