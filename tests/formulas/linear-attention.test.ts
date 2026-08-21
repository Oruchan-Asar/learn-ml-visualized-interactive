import { describe, it, expect } from "vitest";
import {
  QUERIES,
  dot,
  naiveLinearAttention,
  buildState,
  factoredLinearAttention,
  naiveOps,
  linearAttentionOps,
} from "@/lib/math-core/linear-attention";

describe("naiveLinearAttention", () => {
  it("matches the hand-computed values for all three queries", () => {
    expect(naiveLinearAttention(QUERIES[0])).toBeCloseTo(4.5, 10);
    expect(naiveLinearAttention(QUERIES[1])).toBeCloseTo(2.0, 10);
    expect(naiveLinearAttention(QUERIES[2])).toBeCloseTo(19 / 7, 10);
  });
});

describe("buildState", () => {
  it("matches the hand-computed running state", () => {
    const { s, z } = buildState();
    expect(s).toEqual([9, 10]);
    expect(z).toEqual([2, 5]);
  });
});

describe("factoredLinearAttention", () => {
  it("is computed from a state built once, independent of which query is asked", () => {
    const state = buildState();
    expect(factoredLinearAttention(QUERIES[0], state)).toBeCloseTo(4.5, 10);
    expect(factoredLinearAttention(QUERIES[1], state)).toBeCloseTo(2.0, 10);
    expect(factoredLinearAttention(QUERIES[2], state)).toBeCloseTo(19 / 7, 10);
  });

  it("matches naiveLinearAttention exactly for every query — the factoring is an algebraic identity, not an approximation", () => {
    const state = buildState();
    for (const q of QUERIES) {
      expect(factoredLinearAttention(q, state)).toBeCloseTo(naiveLinearAttention(q), 10);
    }
  });

  it("still matches when queries never seen in this file are used", () => {
    const state = buildState();
    const q: [number, number] = [3, -1];
    const naive = naiveLinearAttention(q);
    expect(factoredLinearAttention(q, state)).toBeCloseTo(naive, 10);
  });
});

describe("dot", () => {
  it("computes the plain 2D dot product", () => {
    expect(dot([1, 2], [3, 4])).toBe(11);
  });
});

describe("cost functions", () => {
  it("naiveOps grows quadratically, linearAttentionOps grows linearly", () => {
    expect(naiveOps(10)).toBe(100);
    expect(naiveOps(20)).toBe(400);
    expect(linearAttentionOps(10)).toBe(20);
    expect(linearAttentionOps(20)).toBe(40);
  });

  it("the crossover: linear attention is cheaper than naive attention for any n > 2", () => {
    for (const n of [3, 10, 100, 1000]) {
      expect(linearAttentionOps(n)).toBeLessThan(naiveOps(n));
    }
  });
});
