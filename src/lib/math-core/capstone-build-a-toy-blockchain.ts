import { toyHash } from "./toy-hash";
import { merkleRoot, TRANSACTIONS } from "./cryptographic-primitives-for-decentralization";
import { GENESIS_MINED, DIFFICULTY_TARGET, MAX_NONCE, meetsTarget } from "./nakamoto-consensus-and-proof-of-work";

/**
 * The capstone: chain real blocks end to end using the two primitives this Part already built —
 * `merkleRoot` (from the cryptographic-primitives chapter) commits each block's transactions to one
 * hash, and the proof-of-work mining loop (from the Nakamoto-consensus chapter) finds a nonce that
 * makes the block's hash meet the difficulty target. Nothing here reimplements either; it just chains
 * them together.
 */
export interface ToyBlock {
  index: number;
  prevHash: number;
  merkleRoot: number;
  nonce: number;
  hash: number;
}

/** A capstone block's hash folds in the previous block's hash and this block's Merkle root, in place of the raw data string the earlier mining chapter used. */
export function capstoneBlockHash(prevHash: number, root: number, nonce: number): number {
  return toyHash(`${prevHash}|${root}|${nonce}`);
}

/** Mines block `index`: commits `txs` to a Merkle root, then brute-forces nonces until the block hash meets the target. */
export function mineBlock(
  index: number,
  prevHash: number,
  txs: string[],
  target: number = DIFFICULTY_TARGET,
  maxNonce: number = MAX_NONCE,
): ToyBlock | null {
  const root = merkleRoot(txs);
  for (let nonce = 0; nonce <= maxNonce; nonce++) {
    const hash = capstoneBlockHash(prevHash, root, nonce);
    if (meetsTarget(hash, target)) {
      return { index, prevHash, merkleRoot: root, nonce, hash };
    }
  }
  return null;
}

/** Block 1 reuses the exact 4-transaction set from the cryptographic-primitives chapter, so its Merkle root (577) matches that chapter's worked example. */
export const BLOCK_1_TXS: string[] = TRANSACTIONS;

/** Block 2's transactions — a second, independent batch. */
export const BLOCK_2_TXS: string[] = ["erin pays frank 5", "frank pays grace 2", "grace pays henry 1", "henry pays erin 3"];

/** The genesis block's mined hash, reused directly from the Nakamoto-consensus chapter — this chain's very first link. */
export const GENESIS_HASH: number = GENESIS_MINED.hash;

/** Chains blocks one after another: block $i$'s prevHash is block $i-1$'s mined hash (block 0's prevHash is the genesis hash). */
export function buildChain(blocksTxs: string[][], genesisHash: number = GENESIS_HASH): ToyBlock[] {
  const chain: ToyBlock[] = [];
  let prevHash = genesisHash;
  blocksTxs.forEach((txs, i) => {
    const block = mineBlock(i + 1, prevHash, txs);
    if (!block) throw new Error(`mining failed for block ${i + 1} within maxNonce`);
    chain.push(block);
    prevHash = block.hash;
  });
  return chain;
}

/** This chapter's fixed 2-block chain, built once so the worked example, demos, and checkpoint all reference the same numbers. */
export const TOY_CHAIN: ToyBlock[] = buildChain([BLOCK_1_TXS, BLOCK_2_TXS]);

/**
 * Re-derives each block's Merkle root and re-checks its hash against both the previous block's hash and
 * the difficulty target — exactly what any node replaying the chain from scratch would do. Tampering
 * with a single transaction changes that block's Merkle root, which changes its hash, which breaks the
 * link the next block depends on.
 */
export function validateChain(chain: ToyBlock[], txsByBlock: string[][], genesisHash: number = GENESIS_HASH): boolean {
  let prevHash = genesisHash;
  for (let i = 0; i < chain.length; i++) {
    const block = chain[i];
    const recomputedRoot = merkleRoot(txsByBlock[i]);
    if (block.prevHash !== prevHash) return false;
    if (block.merkleRoot !== recomputedRoot) return false;
    if (capstoneBlockHash(block.prevHash, recomputedRoot, block.nonce) !== block.hash) return false;
    if (!meetsTarget(block.hash, DIFFICULTY_TARGET)) return false;
    prevHash = block.hash;
  }
  return true;
}
