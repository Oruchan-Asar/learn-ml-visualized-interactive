import { describe, it, expect } from "vitest";
import {
  GENESIS_HASH,
  chainHash,
  CHAIN_A,
  CHAIN_B,
  longestChain,
  reversalProbability,
  ATTACKER_SHARE,
  FINALITY_THRESHOLD,
} from "@/lib/math-core/forks-finality-and-the-longest-chain-rule";

describe("chain construction", () => {
  it("matches the hand-worked genesis and chain hashes", () => {
    expect(GENESIS_HASH).toBe(480);
    expect(chainHash(GENESIS_HASH, "a1")).toBe(216);
  });

  it("chains each block off the previous block's hash", () => {
    expect(CHAIN_A).toEqual([
      { data: "a1", hash: 216 },
      { data: "a2", hash: 14 },
      { data: "a3", hash: 883 },
    ]);
    expect(CHAIN_B).toEqual([
      { data: "b1", hash: 247 },
      { data: "b2", hash: 399 },
    ]);
  });
});

describe("longestChain", () => {
  it("picks the fork with more blocks", () => {
    expect(longestChain({ A: CHAIN_A, B: CHAIN_B })).toBe("A");
  });

  it("reports no winner on a tie", () => {
    expect(longestChain({ A: CHAIN_A, B: CHAIN_A })).toBeNull();
  });

  it("flips once the shorter fork is extended past the other", () => {
    const extendedB = [...CHAIN_B, { data: "b3", hash: 1 }, { data: "b4", hash: 2 }];
    expect(longestChain({ A: CHAIN_A, B: extendedB })).toBe("B");
  });
});

describe("reversalProbability", () => {
  it("matches exact powers of the attacker-to-honest ratio at the default 20% share", () => {
    expect(reversalProbability(0)).toBe(1);
    expect(reversalProbability(1)).toBeCloseTo(0.25);
    expect(reversalProbability(2)).toBeCloseTo(0.0625);
    expect(reversalProbability(3)).toBeCloseTo(0.015625);
    expect(reversalProbability(4)).toBeCloseTo(0.00390625);
  });

  it("decreases monotonically as confirmations increase", () => {
    const probs = [0, 1, 2, 3, 4, 5].map((z) => reversalProbability(z));
    for (let i = 1; i < probs.length; i++) expect(probs[i]).toBeLessThan(probs[i - 1]);
  });

  it("is higher for a larger attacker share at the same confirmation depth", () => {
    expect(reversalProbability(2, 0.4)).toBeGreaterThan(reversalProbability(2, ATTACKER_SHARE));
  });

  it("crosses below the finality threshold at exactly 3 confirmations", () => {
    expect(reversalProbability(2)).toBeGreaterThan(FINALITY_THRESHOLD);
    expect(reversalProbability(3)).toBeLessThan(FINALITY_THRESHOLD);
  });
});
