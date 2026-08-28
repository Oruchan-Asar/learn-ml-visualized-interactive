import { assignKey, type RingItem } from "@/lib/math-core/consistent-hashing";
import { NUM_NODES } from "@/lib/math-core/gossip-protocols-and-epidemic-dissemination";

/**
 * The capstone: the exact same 8-node graph from the gossip chapter (ids "0".."7", via NUM_NODES),
 * placed at round positions on a size-16 ring exactly like the consistent-hashing chapter — every
 * node i sits at position 2*i. A 9th node joins at position 15, and this module answers the one
 * question the rest of the chapter is built around: once gossip has told a given node about the
 * new arrival, does that node's own (correctly reused) `assignKey` call agree who owns the key at
 * position 15? Vector clocks for reconciling a write made before that gossip finishes are reused
 * directly from the Dynamo-style-storage chapter's own functions in this chapter's Demos, not
 * reimplemented here.
 */
export const RING_SIZE = 16;
export const NODE_IDS: string[] = Array.from({ length: NUM_NODES }, (_, i) => String(i));
export const NODE_POSITIONS: Record<string, number> = Object.fromEntries(NODE_IDS.map((id, i) => [id, i * 2]));

export const NEW_NODE_ID = "8";
export const NEW_NODE_POS = 15;

/** The one key this chapter tracks: it sits just past the last original node, wrapping to node "0" until node "8" joins. */
export const KEY_POS = 15;

function ringItemsFor(ids: string[]): RingItem[] {
  return ids.map((id) => ({ id, pos: id === NEW_NODE_ID ? NEW_NODE_POS : NODE_POSITIONS[id] }));
}

/**
 * What KEY_POS resolves to under a given membership view — reusing consistent hashing's own
 * `assignKey` rather than re-deriving the clockwise-successor rule. `includesNewNode` stands in
 * for "has this particular node's gossip view heard about node 8 yet?"
 */
export function ownerAccordingTo(includesNewNode: boolean): string {
  const ids = includesNewNode ? [...NODE_IDS, NEW_NODE_ID] : NODE_IDS;
  return assignKey(KEY_POS, ringItemsFor(ids));
}

/** Whether every one of the original 8 nodes has heard about node 8 — i.e., the whole cluster now agrees on KEY_POS's owner. */
export function fullyConverged(informedCount: number): boolean {
  return informedCount === NUM_NODES;
}
