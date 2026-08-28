/**
 * Kademlia's routing metric on a small fixed 4-bit id space (0-15, same size as the Chord
 * chapter's ring): one fixed self node plus 6 other nodes, small enough to compute every XOR
 * distance and bucket assignment by hand.
 */
export const ID_BITS = 4;
export const SELF_ID = 6; // 0110
export const NODE_IDS: number[] = [7, 4, 3, 0, 9, 13];

/** Kademlia's distance metric: XOR treats ids as bit vectors, ignoring magnitude entirely. */
export function xorDistance(a: number, b: number): number {
  return a ^ b;
}

/**
 * Which k-bucket a distance falls into: bucket $i$ holds ids at distance $[2^i, 2^{i+1})$ from
 * self, so bucket $0$ is the "nearest neighborhood" and the highest bucket is the whole rest of
 * the address space.
 */
export function bucketIndex(distance: number): number {
  if (distance <= 0) throw new Error("bucketIndex requires a positive distance — a node has no bucket distance to itself");
  return Math.floor(Math.log2(distance));
}

/** Buckets every other known node by its distance from `selfId`, indexed bucket[0..bits-1]. */
export function kBuckets(selfId: number, nodeIds: number[], bits: number = ID_BITS): number[][] {
  const buckets: number[][] = Array.from({ length: bits }, () => []);
  for (const id of nodeIds) {
    if (id === selfId) continue;
    buckets[bucketIndex(xorDistance(selfId, id))].push(id);
  }
  return buckets;
}

/** The k nodes with the smallest XOR distance to `targetId` — Kademlia's lookup contact list. */
export function closestNodes(targetId: number, nodeIds: number[], k: number): number[] {
  return [...nodeIds].sort((a, b) => xorDistance(a, targetId) - xorDistance(b, targetId)).slice(0, k);
}
