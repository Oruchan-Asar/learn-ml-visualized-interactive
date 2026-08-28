/**
 * Dynamo's two core ideas, each on a small fixed scenario: a 5-node preference list for sloppy
 * quorums and hinted handoff, and 3-replica vector clocks for detecting concurrent writes — all
 * exact, hand-checkable arithmetic.
 */
export const PREF_LIST: string[] = ["N1", "N2", "N3", "N4", "N5"];
export const N = PREF_LIST.length;

export type VectorClock = Record<string, number>;

/** A replica may only ever bump its own counter when it accepts a write. */
export function incrementClock(clock: VectorClock, replicaId: string): VectorClock {
  return { ...clock, [replicaId]: (clock[replicaId] ?? 0) + 1 };
}

/** Read-repair/anti-entropy merge: the pointwise max of every replica's counter across both clocks. */
export function mergeClocks(a: VectorClock, b: VectorClock): VectorClock {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const result: VectorClock = {};
  for (const k of keys) {
    result[k] = Math.max(a[k] ?? 0, b[k] ?? 0);
  }
  return result;
}

/**
 * Compares two vector clocks: "before" if every counter in `a` is <= the matching one in `b`
 * (with at least one strictly less), "after" the mirror image, "equal" if all match, and
 * "concurrent" if neither dominates the other — the signal of an unreconciled write conflict.
 */
export function compareClocks(a: VectorClock, b: VectorClock): "before" | "after" | "equal" | "concurrent" {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let aLess = false;
  let aGreater = false;
  for (const k of keys) {
    const av = a[k] ?? 0;
    const bv = b[k] ?? 0;
    if (av < bv) aLess = true;
    if (av > bv) aGreater = true;
  }
  if (!aLess && !aGreater) return "equal";
  if (aLess && !aGreater) return "before";
  if (aGreater && !aLess) return "after";
  return "concurrent";
}

/** The nodes present in both a read set and a write set — Dynamo's guaranteed overlap when R+W>N. */
export function quorumOverlap(readSet: string[], writeSet: string[]): string[] {
  const reads = new Set(readSet);
  return writeSet.filter((n) => reads.has(n));
}

/** Dynamo's sloppy-quorum guarantee: any R-sized read set and any W-sized write set out of N nodes must intersect iff R+W>N. */
export function sufficientQuorum(r: number, w: number, n: number = N): boolean {
  return r + w > n;
}

export interface WriteTargetsResult {
  /** The W healthy nodes a write actually goes to, walking the preference list in order. */
  targets: string[];
  /** Maps a stand-in node to the down node whose hint it's carrying (hinted handoff). */
  hintedFor: Record<string, string>;
}

/**
 * Walks the preference list picking the first `w` healthy nodes as write targets. Any down node
 * encountered along the way is skipped, and the next healthy node picked up afterward is recorded
 * as holding a *hint* for it — the node to hand the write off to once it recovers.
 */
export function writeTargets(prefList: string[], downNodes: ReadonlySet<string>, w: number): WriteTargetsResult {
  const targets: string[] = [];
  const hintedFor: Record<string, string> = {};
  const pendingHints: string[] = [];

  for (const node of prefList) {
    if (targets.length >= w) break;
    if (downNodes.has(node)) {
      pendingHints.push(node);
      continue;
    }
    targets.push(node);
    if (pendingHints.length > 0) {
      hintedFor[node] = pendingHints.shift()!;
    }
  }
  return { targets, hintedFor };
}
