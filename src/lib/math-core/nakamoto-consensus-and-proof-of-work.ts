import { toyHash } from "./toy-hash";

/** The genesis block's fixed inputs, reused everywhere this chapter needs "a block being mined". */
export const GENESIS_PREV_HASH = 0;
export const GENESIS_DATA = "block-one";

/** A hash under this value (out of the possible [0, 1000)) counts as "found" — the puzzle's difficulty. */
export const DIFFICULTY_TARGET = 50;

/** Nonces are searched in this range — small enough to brute-force by hand or eye. */
export const MAX_NONCE = 999;

/** A block's hash: everything that identifies it — the previous block's hash, its data, and the nonce being tried. */
export function blockHash(prevHash: number, data: string, nonce: number): number {
  return toyHash(`${prevHash}|${data}|${nonce}`);
}

/** Whether a hash satisfies the difficulty target — the entire proof-of-work check. */
export function meetsTarget(hash: number, target: number = DIFFICULTY_TARGET): boolean {
  return hash < target;
}

export interface MiningResult {
  nonce: number;
  hash: number;
  /** How many nonces (0..nonce) were tried before this one succeeded. */
  attempts: number;
}

/**
 * Mining, literally: try nonce 0, 1, 2, ... until blockHash falls under the target, or give up at
 * maxNonce. There's no shortcut — no way to predict which nonce will work without just trying it,
 * which is exactly what makes finding one *expensive* and checking one (meetsTarget) *free*.
 */
export function mineNonce(
  prevHash: number,
  data: string,
  target: number = DIFFICULTY_TARGET,
  maxNonce: number = MAX_NONCE,
): MiningResult | null {
  for (let nonce = 0; nonce <= maxNonce; nonce++) {
    const hash = blockHash(prevHash, data, nonce);
    if (meetsTarget(hash, target)) {
      return { nonce, hash, attempts: nonce + 1 };
    }
  }
  return null;
}

/** With hashes uniform over [0, 1000), a fraction target/1000 of nonces succeed — so this many tries are expected on average. */
export function expectedAttempts(target: number = DIFFICULTY_TARGET): number {
  return 1000 / target;
}

/** The genesis block, mined once so every other chapter (and the capstone) can chain off the same fixed result. */
export const GENESIS_MINED: MiningResult = mineNonce(GENESIS_PREV_HASH, GENESIS_DATA)!;

/** A second block's data, used by this chapter's checkpoint — chained onto the genesis block's mined hash. */
export const CHECKPOINT_BLOCK_DATA = "checkpoint-block";
