import { toyHash, toyHashPair } from "./toy-hash";

/**
 * Four toy transactions, reused everywhere this Part needs "a block of transactions" —
 * this chapter's Merkle tree, and the capstone's toy chain, both trace back to these exact
 * strings so the numbers line up across chapters.
 */
export const TRANSACTIONS: string[] = [
  "alice pays bob 3",
  "bob pays carol 1",
  "carol pays dave 2",
  "dave pays alice 1",
];

/** Hashes each transaction independently — the Merkle tree's leaf layer. */
export function leafHashes(txs: string[] = TRANSACTIONS): number[] {
  return txs.map(toyHash);
}

/**
 * Builds every layer of a Merkle tree from the leaves up to the single root, pairing
 * adjacent hashes at each level with toyHashPair. Works for any power-of-two-length input
 * (2, 4, 8, ...) — the capstone reuses this for its own, smaller blocks.
 */
export function merkleLevels(txs: string[]): number[][] {
  let level = leafHashes(txs);
  const levels: number[][] = [level];
  while (level.length > 1) {
    const next: number[] = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(toyHashPair(level[i], level[i + 1]));
    }
    level = next;
    levels.push(level);
  }
  return levels;
}

/** The single Merkle root at the top of the tree. */
export function merkleRoot(txs: string[]): number {
  const levels = merkleLevels(txs);
  return levels[levels.length - 1][0];
}

export interface MerkleTree {
  /** Hash of each of the 4 transactions. */
  leaves: number[];
  /** The 2 parent hashes, one per adjacent pair of leaves. */
  parents: number[];
  /** The single root hash — the parents' parent. */
  root: number;
}

/** The named 3-level tree (leaves, parents, root) this chapter's diagram draws — the fixed 4-transaction case. */
export function buildMerkleTree(txs: string[] = TRANSACTIONS): MerkleTree {
  const levels = merkleLevels(txs);
  return { leaves: levels[0], parents: levels[1], root: levels[2][0] };
}

/**
 * A toy stand-in for a digital signature: whoever holds `privateKey` can produce a value
 * that `toyVerify` accepts for that exact message, and nobody else can (with a different
 * key, toyHash's avalanche effect makes the output essentially unrelated). Not real
 * asymmetric cryptography — real signatures let anyone verify with a *public* key without
 * ever learning the private one — but it demonstrates the operational property that matters
 * here: signatures bind a specific signer to a specific message, and tampering with either
 * breaks verification.
 */
export function toySign(message: string, privateKey: string): number {
  return toyHash(`${privateKey}:${message}`);
}

/** Recomputes the signature from the (claimed) signer's key and checks it matches. */
export function toyVerify(message: string, signature: number, privateKey: string): boolean {
  return toySign(message, privateKey) === signature;
}
