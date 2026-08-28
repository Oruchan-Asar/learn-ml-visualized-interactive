import { describe, it, expect } from "vitest";
import { toyHash, toyHashPair } from "@/lib/math-core/toy-hash";

describe("toyHash", () => {
  it("is deterministic: the same input always hashes the same", () => {
    expect(toyHash("block-1")).toBe(toyHash("block-1"));
  });

  it("stays within [0, 1000)", () => {
    for (const s of ["a", "genesis", "block-42", "nonce-999", ""]) {
      const h = toyHash(s);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(1000);
    }
  });

  it("exhibits an avalanche effect: single-character changes produce different hashes", () => {
    expect(toyHash("block-1")).not.toBe(toyHash("block-2"));
    expect(toyHash("block-1")).not.toBe(toyHash("Block-1"));
  });

  it("matches a hand-worked example: empty string hashes to 0", () => {
    expect(toyHash("")).toBe(0);
  });
});

describe("toyHashPair", () => {
  it("is deterministic and order-sensitive", () => {
    const a = toyHashPair(1, 2);
    const b = toyHashPair(2, 1);
    expect(a).toBe(toyHashPair(1, 2));
    expect(a).not.toBe(b);
  });

  it("matches toyHash of the piped string form", () => {
    expect(toyHashPair(12, 34)).toBe(toyHash("12|34"));
  });
});
