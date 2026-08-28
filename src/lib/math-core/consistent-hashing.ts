/**
 * A small fixed ring of size 16 (positions 0-15, like a 4-bit hash space) with 4 nodes and 6
 * keys at round hash positions — small enough that every key's owner, and every reassignment
 * when the node set changes, can be checked by hand.
 */
export const RING_SIZE = 16;

export interface RingItem {
  id: string;
  pos: number;
}

export const NODES: RingItem[] = [
  { id: "A", pos: 2 },
  { id: "B", pos: 6 },
  { id: "C", pos: 9 },
  { id: "D", pos: 13 },
];

export const KEYS: RingItem[] = [
  { id: "k1", pos: 0 },
  { id: "k2", pos: 4 },
  { id: "k3", pos: 7 },
  { id: "k4", pos: 10 },
  { id: "k5", pos: 12 },
  { id: "k6", pos: 15 },
];

/**
 * Consistent hashing's placement rule: a key belongs to the first node encountered walking
 * clockwise from its position — its ring successor. If no node's position is >= the key's
 * position, the ring wraps around to the smallest-positioned node.
 */
export function assignKey(keyPos: number, nodes: RingItem[]): string {
  if (nodes.length === 0) throw new Error("assignKey requires at least one node on the ring");
  const sorted = [...nodes].sort((a, b) => a.pos - b.pos);
  const successor = sorted.find((n) => n.pos >= keyPos);
  return (successor ?? sorted[0]).id;
}

/** Assigns every key in `keys` to its owning node, keyed by key id. */
export function assignAll(nodes: RingItem[], keys: RingItem[]): Record<string, string> {
  return Object.fromEntries(keys.map((k) => [k.id, assignKey(k.pos, nodes)]));
}

/** The key ids whose owner differs between two assignments — how much reshuffling a ring change caused. */
export function reassignedKeys(before: Record<string, string>, after: Record<string, string>): string[] {
  return Object.keys(before).filter((k) => before[k] !== after[k]);
}
