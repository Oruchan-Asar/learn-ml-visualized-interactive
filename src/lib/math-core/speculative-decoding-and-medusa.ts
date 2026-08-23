/**
 * Speculative decoding (and Medusa's multi-head variant) lets a cheap draft process propose several
 * tokens at once, then spends one big-model forward pass verifying all of them in parallel. The big model
 * accepts the longest prefix of guesses that matches what it would have generated itself, then always
 * contributes one more correct "bonus" token for free at the mismatch point (or at the end, if every
 * guess was right) — because that token came out of the same forward pass anyway. Standard one-token-at-
 * a-time decoding needs one big-model call per token; speculative decoding needs one call per *round*,
 * each round worth several tokens.
 */

/** The ground-truth sequence the big model would generate, one token at a time, from this context. */
export const TARGET_SEQUENCE = ["the", "cat", "sat", "on", "the", "mat", "and", "slept"];

/** How many tokens the draft model proposes per round. */
export const DRAFT_LEN = 3;

/** The draft model's guesses for each round (fixed, so every round is exact and hand-checkable). */
export const DRAFT_ROUNDS: string[][] = [
  ["the", "cat", "dog"],
  ["on", "the", "moon"],
  ["and", "slept", "forever"],
];

export interface RoundResult {
  accepted: number;
  emitted: string[];
}

/**
 * Compares one round's guesses against the still-remaining target tokens. Accepts the longest matching
 * prefix, then adds one bonus token (the big model's own correct next token) if any target remains.
 */
export function runRound(remainingTarget: string[], guesses: string[]): RoundResult {
  let accepted = 0;
  while (accepted < guesses.length && accepted < remainingTarget.length && guesses[accepted] === remainingTarget[accepted]) {
    accepted++;
  }
  const hasBonus = accepted < remainingTarget.length;
  const emittedCount = accepted + (hasBonus ? 1 : 0);
  return { accepted, emitted: remainingTarget.slice(0, emittedCount) };
}

export interface Session {
  rounds: RoundResult[];
  totalTokens: number;
  totalCalls: number;
}

/** Runs every round in order, consuming the target sequence, until it's fully emitted or rounds run out. */
export function simulateSession(target: string[] = TARGET_SEQUENCE, draftRounds: string[][] = DRAFT_ROUNDS): Session {
  const rounds: RoundResult[] = [];
  let remaining = target;
  for (const guesses of draftRounds) {
    if (remaining.length === 0) break;
    const result = runRound(remaining, guesses);
    rounds.push(result);
    remaining = remaining.slice(result.emitted.length);
  }
  const totalTokens = rounds.reduce((sum, r) => sum + r.emitted.length, 0);
  return { rounds, totalTokens, totalCalls: rounds.length };
}

export function tokensPerCall(session: Session): number {
  return session.totalCalls === 0 ? 0 : session.totalTokens / session.totalCalls;
}

/** Standard autoregressive decoding: exactly one token per big-model call. */
export const BASELINE_TOKENS_PER_CALL = 1;

/** Unseen checkpoint round: a fresh remaining target and a fresh set of guesses. */
export const CHECKPOINT_REMAINING = ["is", "fun", "today", "always"];
export const CHECKPOINT_GUESSES = ["is", "fun", "great"];
export const CHECKPOINT_CANDIDATES = [1, 2, 3, 4];
