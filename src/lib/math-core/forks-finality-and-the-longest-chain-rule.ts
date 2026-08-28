import { toyHash } from "./toy-hash";

/**
 * Hashes a block without a nonce: this chapter is about what happens once blocks already exist and
 * two chains compete, not about mining them (see the proof-of-work chapter for that). Both forks below
 * chain off the same fixed genesis hash so their divergence is the only thing that differs.
 */
export function chainHash(prevHash: number, data: string): number {
  return toyHash(`${prevHash}|${data}`);
}

/** The shared ancestor both forks below branch from. */
export const GENESIS_HASH = toyHash("genesis");

export interface ForkBlock {
  data: string;
  hash: number;
}

/** Appends one block of data onto a chain, hashing it against the chain's current tip (or genesis, if empty). */
export function extendChain(chain: ForkBlock[], data: string): ForkBlock[] {
  const prevHash = chain.length === 0 ? GENESIS_HASH : chain[chain.length - 1].hash;
  return [...chain, { data, hash: chainHash(prevHash, data) }];
}

/** Chain A: 3 blocks forked off the shared genesis. */
export const CHAIN_A: ForkBlock[] = ["a1", "a2", "a3"].reduce(extendChain, [] as ForkBlock[]);

/** Chain B: 2 blocks forked off the same genesis — a shorter, competing history. */
export const CHAIN_B: ForkBlock[] = ["b1", "b2"].reduce(extendChain, [] as ForkBlock[]);

/**
 * The longest-chain rule: whichever fork has accumulated the most blocks (standing in for "most
 * cumulative proof-of-work") is canonical. A tie has no winner yet — nodes keep both until one pulls
 * ahead.
 */
export function longestChain(chains: Record<string, ForkBlock[]>): string | null {
  const entries = Object.entries(chains);
  const maxLen = Math.max(...entries.map(([, chain]) => chain.length));
  const winners = entries.filter(([, chain]) => chain.length === maxLen);
  return winners.length === 1 ? winners[0][0] : null;
}

/** The attacker's share of total mining power in this chapter's fixed finality scenario. */
export const ATTACKER_SHARE = 0.2;

/**
 * A simplified probability that an attacker holding `attackerShare` of the network's mining power
 * eventually produces a longer secret fork and reverses a block that already has `confirmations`
 * honest blocks built on top of it. Real Nakamoto-consensus analysis models this as a Poisson race
 * between the honest and attacker chains; this ratio keeps the same qualitative shape — decaying
 * exponentially in confirmations — with numbers simple enough to check by hand.
 */
export function reversalProbability(confirmations: number, attackerShare: number = ATTACKER_SHARE): number {
  const ratio = attackerShare / (1 - attackerShare);
  return Math.pow(ratio, confirmations);
}

/** Below this probability, a block is treated as "final enough" in this chapter's worked example and checkpoint. */
export const FINALITY_THRESHOLD = 0.02;
