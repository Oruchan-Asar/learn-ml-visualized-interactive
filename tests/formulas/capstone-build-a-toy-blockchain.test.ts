import { describe, it, expect } from "vitest";
import { merkleRoot, TRANSACTIONS } from "@/lib/math-core/cryptographic-primitives-for-decentralization";
import { GENESIS_MINED, DIFFICULTY_TARGET, meetsTarget } from "@/lib/math-core/nakamoto-consensus-and-proof-of-work";
import {
  GENESIS_HASH,
  BLOCK_1_TXS,
  BLOCK_2_TXS,
  capstoneBlockHash,
  mineBlock,
  buildChain,
  TOY_CHAIN,
  validateChain,
} from "@/lib/math-core/capstone-build-a-toy-blockchain";

describe("reuse of the Part's existing primitives", () => {
  it("block 1 reuses the exact transaction set (and Merkle root) from the crypto-primitives chapter", () => {
    expect(BLOCK_1_TXS).toBe(TRANSACTIONS);
    expect(merkleRoot(BLOCK_1_TXS)).toBe(577);
  });

  it("the chain's genesis hash is exactly the Nakamoto chapter's mined genesis hash", () => {
    expect(GENESIS_HASH).toBe(GENESIS_MINED.hash);
    expect(GENESIS_HASH).toBe(33);
  });
});

describe("mineBlock", () => {
  it("mines block 1 onto the genesis hash with the hand-worked nonce and hash", () => {
    const block = mineBlock(1, GENESIS_HASH, BLOCK_1_TXS);
    expect(block).toEqual({ index: 1, prevHash: 33, merkleRoot: 577, nonce: 600, hash: 43 });
  });

  it("every mined block's hash meets the difficulty target", () => {
    const block = mineBlock(1, GENESIS_HASH, BLOCK_1_TXS);
    expect(meetsTarget(block!.hash, DIFFICULTY_TARGET)).toBe(true);
  });

  it("is deterministic", () => {
    expect(mineBlock(1, GENESIS_HASH, BLOCK_1_TXS)).toEqual(mineBlock(1, GENESIS_HASH, BLOCK_1_TXS));
  });
});

describe("TOY_CHAIN", () => {
  it("chains block 2's prevHash onto block 1's mined hash", () => {
    expect(TOY_CHAIN).toHaveLength(2);
    expect(TOY_CHAIN[0]).toEqual({ index: 1, prevHash: 33, merkleRoot: 577, nonce: 600, hash: 43 });
    expect(TOY_CHAIN[1]).toEqual({ index: 2, prevHash: 43, merkleRoot: 506, nonce: 900, hash: 19 });
  });

  it("is exactly what buildChain produces from the same block transaction sets", () => {
    expect(buildChain([BLOCK_1_TXS, BLOCK_2_TXS])).toEqual(TOY_CHAIN);
  });
});

describe("validateChain", () => {
  it("accepts the untampered chain", () => {
    expect(validateChain(TOY_CHAIN, [BLOCK_1_TXS, BLOCK_2_TXS])).toBe(true);
  });

  it("rejects the chain once a transaction in block 1 is tampered with", () => {
    const tamperedTxs = ["alice pays bob 9", ...BLOCK_1_TXS.slice(1)];
    expect(validateChain(TOY_CHAIN, [tamperedTxs, BLOCK_2_TXS])).toBe(false);
  });

  it("rejects a chain whose block 2 doesn't actually link to block 1's hash", () => {
    const brokenChain = [TOY_CHAIN[0], { ...TOY_CHAIN[1], prevHash: 999 }];
    expect(validateChain(brokenChain, [BLOCK_1_TXS, BLOCK_2_TXS])).toBe(false);
  });

  it("rejects a block that's internally consistent but never actually met the difficulty target", () => {
    // nonce 0 against (prevHash 33, root 577) hashes to 981 — a self-consistent but unmined block.
    const brokenChain = [{ index: 1, prevHash: 33, merkleRoot: 577, nonce: 0, hash: 981 }, TOY_CHAIN[1]];
    expect(validateChain(brokenChain, [BLOCK_1_TXS, BLOCK_2_TXS])).toBe(false);
  });
});

describe("capstoneBlockHash", () => {
  it("matches the piped-string form toyHash would produce", () => {
    expect(capstoneBlockHash(33, 577, 600)).toBe(43);
  });
});
