import { describe, it, expect } from "vitest";
import {
  TRANSACTIONS,
  leafHashes,
  merkleLevels,
  merkleRoot,
  buildMerkleTree,
  toySign,
  toyVerify,
} from "@/lib/math-core/cryptographic-primitives-for-decentralization";

describe("leaf hashes", () => {
  it("hashes the 4 fixed transactions to the expected exact values", () => {
    expect(leafHashes()).toEqual([459, 416, 636, 976]);
  });

  it("hashes an arbitrary transaction list the same way", () => {
    expect(leafHashes(["alice pays bob 3"])).toEqual([459]);
  });
});

describe("the Merkle tree", () => {
  it("builds the expected 3 levels: 4 leaves, 2 parents, 1 root", () => {
    const levels = merkleLevels(TRANSACTIONS);
    expect(levels).toEqual([[459, 416, 636, 976], [741, 229], [577]]);
  });

  it("buildMerkleTree names each level", () => {
    const tree = buildMerkleTree();
    expect(tree.leaves).toEqual([459, 416, 636, 976]);
    expect(tree.parents).toEqual([741, 229]);
    expect(tree.root).toBe(577);
  });

  it("merkleRoot matches the top of merkleLevels", () => {
    expect(merkleRoot(TRANSACTIONS)).toBe(577);
  });

  it("is tamper-evident: changing one transaction changes the root", () => {
    const tampered = ["alice pays bob 9", ...TRANSACTIONS.slice(1)];
    const tamperedRoot = merkleRoot(tampered);
    expect(tamperedRoot).not.toBe(577);
    expect(tamperedRoot).toBe(301);
  });

  it("works for a smaller, 2-transaction block (the capstone's block size)", () => {
    const levels = merkleLevels(TRANSACTIONS.slice(0, 2));
    expect(levels).toEqual([[459, 416], [741]]);
  });
});

describe("toy signatures", () => {
  const msg = TRANSACTIONS[0];

  it("signs deterministically", () => {
    expect(toySign(msg, "alice-secret")).toBe(248);
  });

  it("verifies a signature made with the claimed key", () => {
    const sig = toySign(msg, "alice-secret");
    expect(toyVerify(msg, sig, "alice-secret")).toBe(true);
  });

  it("rejects a signature made with a different key", () => {
    const forgedSig = toySign(msg, "eve-secret");
    expect(forgedSig).toBe(628);
    expect(toyVerify(msg, forgedSig, "alice-secret")).toBe(false);
  });

  it("rejects verification against a tampered message", () => {
    const sig = toySign(msg, "alice-secret");
    expect(toyVerify("alice pays bob 9", sig, "alice-secret")).toBe(false);
  });
});
