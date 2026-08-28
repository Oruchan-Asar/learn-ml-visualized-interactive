import { describe, it, expect } from "vitest";
import {
  GENESIS_PREV_HASH,
  GENESIS_DATA,
  DIFFICULTY_TARGET,
  MAX_NONCE,
  CHECKPOINT_BLOCK_DATA,
  blockHash,
  meetsTarget,
  mineNonce,
  expectedAttempts,
  GENESIS_MINED,
} from "@/lib/math-core/nakamoto-consensus-and-proof-of-work";

describe("blockHash", () => {
  it("matches hand-computed values for the first few nonces on the genesis block", () => {
    expect(blockHash(GENESIS_PREV_HASH, GENESIS_DATA, 0)).toBe(934);
    expect(blockHash(GENESIS_PREV_HASH, GENESIS_DATA, 1)).toBe(935);
    expect(blockHash(GENESIS_PREV_HASH, GENESIS_DATA, 9)).toBe(943);
  });

  it("is sensitive to every one of its inputs", () => {
    const h = blockHash(0, "block-one", 10);
    expect(blockHash(1, "block-one", 10)).not.toBe(h);
    expect(blockHash(0, "block-two", 10)).not.toBe(h);
    expect(blockHash(0, "block-one", 11)).not.toBe(h);
  });
});

describe("meetsTarget", () => {
  it("is a strict less-than the target", () => {
    expect(meetsTarget(49, 50)).toBe(true);
    expect(meetsTarget(50, 50)).toBe(false);
    expect(meetsTarget(0, 1)).toBe(true);
  });
});

describe("mineNonce", () => {
  it("finds nonce 10 for the genesis block — the first nonce whose hash drops under 50", () => {
    const result = mineNonce(GENESIS_PREV_HASH, GENESIS_DATA, DIFFICULTY_TARGET);
    expect(result).toEqual({ nonce: 10, hash: 33, attempts: 11 });
  });

  it("GENESIS_MINED is exactly that result, precomputed", () => {
    expect(GENESIS_MINED).toEqual({ nonce: 10, hash: 33, attempts: 11 });
  });

  it("chains a second block onto the genesis block's mined hash", () => {
    const result = mineNonce(GENESIS_MINED.hash, CHECKPOINT_BLOCK_DATA, DIFFICULTY_TARGET);
    expect(result).toEqual({ nonce: 90, hash: 7, attempts: 91 });
  });

  it("returns null when no nonce in range satisfies an impossible target", () => {
    expect(mineNonce(GENESIS_PREV_HASH, GENESIS_DATA, 0, MAX_NONCE)).toBeNull();
  });

  it("respects a smaller maxNonce, even if a solution exists beyond it", () => {
    expect(mineNonce(GENESIS_PREV_HASH, GENESIS_DATA, DIFFICULTY_TARGET, 5)).toBeNull();
  });
});

describe("expectedAttempts", () => {
  it("is 1000/target", () => {
    expect(expectedAttempts(50)).toBe(20);
    expect(expectedAttempts(100)).toBe(10);
    expect(expectedAttempts(10)).toBe(100);
  });
});
