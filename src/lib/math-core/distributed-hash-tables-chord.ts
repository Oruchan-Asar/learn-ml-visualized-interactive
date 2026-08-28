/**
 * Chord layered on the same size-16 ring idea as the consistent-hashing chapter (4-bit ids, so
 * m=4 fingers per node), with 4 fixed nodes — small enough to hand-verify every finger-table entry
 * and every lookup hop.
 */
export const RING_SIZE = 16;
export const M_BITS = 4; // log2(RING_SIZE)

export const NODE_POSITIONS: number[] = [2, 6, 9, 13];

/** Clockwise distance from `cur` to `x` on a ring of size `ringSize` — always in [0, ringSize). */
function rel(x: number, cur: number, ringSize: number): number {
  return ((x - cur) % ringSize + ringSize) % ringSize;
}

/** The ring successor of `queryPos`: the smallest node position >= queryPos, wrapping to the smallest node if none qualify. */
export function successor(queryPos: number, nodePositions: number[], ringSize: number = RING_SIZE): number {
  if (nodePositions.length === 0) throw new Error("successor requires at least one node");
  const sorted = [...nodePositions].sort((a, b) => a - b);
  const q = ((queryPos % ringSize) + ringSize) % ringSize;
  const found = sorted.find((p) => p >= q);
  return found ?? sorted[0];
}

/**
 * Node `nodePos`'s finger table: finger[i] = successor(nodePos + 2^i), for i = 0..m-1. finger[0]
 * is exactly the node's immediate successor on the ring.
 */
export function fingerTable(nodePos: number, nodePositions: number[], m: number = M_BITS, ringSize: number = RING_SIZE): number[] {
  const table: number[] = [];
  for (let i = 0; i < m; i++) {
    table.push(successor(nodePos + 2 ** i, nodePositions, ringSize));
  }
  return table;
}

/**
 * The furthest finger that still lies strictly between `cur` and `target` (without passing it) —
 * the standard Chord routing rule for jumping as far as possible each hop. Returns null when no
 * finger qualifies, meaning `cur`'s immediate successor must be the answer.
 */
export function closestPrecedingFinger(cur: number, target: number, fingers: number[], ringSize: number = RING_SIZE): number | null {
  const relTarget = rel(target, cur, ringSize);
  for (let i = fingers.length - 1; i >= 0; i--) {
    const relF = rel(fingers[i], cur, ringSize);
    if (relF > 0 && relF < relTarget) return fingers[i];
  }
  return null;
}

export interface ChordLookupResult {
  /** Every node visited, starting with the querying node. */
  path: number[];
  /** The node that owns `targetPos`. */
  owner: number;
  /** Number of hops taken (path.length - 1). */
  hops: number;
}

/** Simulates Chord's iterative lookup: at each hop, jump to the furthest finger that doesn't overshoot the target. */
export function chordLookup(
  startPos: number,
  targetPos: number,
  nodePositions: number[] = NODE_POSITIONS,
  m: number = M_BITS,
  ringSize: number = RING_SIZE,
): ChordLookupResult {
  const path: number[] = [startPos];
  let cur = startPos;
  const normalizedTarget = ((targetPos % ringSize) + ringSize) % ringSize;

  for (let guard = 0; guard <= m; guard++) {
    // A node querying a key at exactly its own position owns that key itself (successor(x) treats
    // an exact match as its own owner too) — without this, the loop below would wrongly hand it to
    // whichever node comes next, since rel(target, cur) === 0 otherwise looks indistinguishable from
    // "target is somewhere in (cur, successor(cur)]".
    if (cur === normalizedTarget) {
      return { path, owner: cur, hops: path.length - 1 };
    }
    const fingers = fingerTable(cur, nodePositions, m, ringSize);
    const succ = fingers[0];
    const relTarget = rel(targetPos, cur, ringSize);
    const relSucc = rel(succ, cur, ringSize);

    if (relTarget <= relSucc) {
      return { path, owner: succ, hops: path.length - 1 };
    }

    const jump = closestPrecedingFinger(cur, targetPos, fingers, ringSize);
    if (jump === null) {
      return { path, owner: succ, hops: path.length - 1 };
    }
    cur = jump;
    path.push(cur);
  }

  // Safety fallback — should be unreachable for a correctly-built finger table within m hops.
  return { path, owner: successor(cur, nodePositions, ringSize), hops: path.length - 1 };
}
