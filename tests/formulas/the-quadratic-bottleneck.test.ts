import { describe, it, expect } from "vitest";
import { attentionOps, linearOps, costRatio, D_MODEL, SEQUENCE_LENGTHS } from "@/lib/math-core/the-quadratic-bottleneck";

describe("attentionOps", () => {
  it("matches n² × d exactly", () => {
    expect(attentionOps(4)).toBe(4 * 4 * D_MODEL);
    expect(attentionOps(8)).toBe(8 * 8 * D_MODEL);
  });

  it("quadruples when the sequence length doubles", () => {
    expect(attentionOps(8) / attentionOps(4)).toBeCloseTo(4, 10);
    expect(attentionOps(16) / attentionOps(8)).toBeCloseTo(4, 10);
    expect(attentionOps(128) / attentionOps(64)).toBeCloseTo(4, 10);
  });
});

describe("linearOps", () => {
  it("matches n × d exactly", () => {
    expect(linearOps(4)).toBe(4 * D_MODEL);
  });

  it("only doubles when the sequence length doubles", () => {
    expect(linearOps(8) / linearOps(4)).toBeCloseTo(2, 10);
    expect(linearOps(128) / linearOps(64)).toBeCloseTo(2, 10);
  });
});

describe("costRatio", () => {
  it("equals the sequence length exactly, independent of D_MODEL", () => {
    for (const n of SEQUENCE_LENGTHS) {
      expect(costRatio(n)).toBeCloseTo(n, 10);
      expect(costRatio(n, 64)).toBeCloseTo(n, 10);
    }
  });

  it("matches the hand-computed values for every candidate sequence length", () => {
    expect(SEQUENCE_LENGTHS.map((n) => costRatio(n))).toEqual([4, 8, 16, 32, 64, 128]);
  });
});
