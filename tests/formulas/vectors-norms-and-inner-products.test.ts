import { describe, it, expect } from "vitest";
import {
  l1Norm,
  l2Norm,
  lInfNorm,
  cosineSimilarity,
  cosineDistance,
} from "@/lib/math-core/vectors-norms-and-inner-products";

describe("norms of v = (3, 4)", () => {
  const v = { x: 3, y: 4 };

  it("matches the worked example: L1 = 7, L2 = 5, Linf = 4", () => {
    expect(l1Norm(v)).toBeCloseTo(7);
    expect(l2Norm(v)).toBeCloseTo(5);
    expect(lInfNorm(v)).toBeCloseTo(4);
  });

  it("orders the three norms as Linf <= L2 <= L1, as the norm inequality guarantees", () => {
    for (const w of [{ x: 3, y: 4 }, { x: -2, y: 5 }, { x: 1, y: -1 }, { x: 6, y: 0 }]) {
      expect(lInfNorm(w)).toBeLessThanOrEqual(l2Norm(w) + 1e-9);
      expect(l2Norm(w)).toBeLessThanOrEqual(l1Norm(w) + 1e-9);
    }
  });

  it("is zero only for the zero vector", () => {
    expect(l1Norm({ x: 0, y: 0 })).toBe(0);
    expect(l2Norm({ x: 0, y: 0 })).toBe(0);
    expect(lInfNorm({ x: 0, y: 0 })).toBe(0);
  });
});

describe("cosine similarity and distance", () => {
  it("matches the worked example: a=(4,0), b=(3,4) gives similarity 0.6, distance 0.4", () => {
    const a = { x: 4, y: 0 };
    const b = { x: 3, y: 4 };
    expect(cosineSimilarity(a, b)).toBeCloseTo(0.6);
    expect(cosineDistance(a, b)).toBeCloseTo(0.4);
  });

  it("is 1 (distance 0) for a vector compared with itself", () => {
    const a = { x: 5, y: -2 };
    expect(cosineSimilarity(a, a)).toBeCloseTo(1);
    expect(cosineDistance(a, a)).toBeCloseTo(0);
  });

  it("is 0 (distance 1) for perpendicular vectors", () => {
    const a = { x: 1, y: 0 };
    const b = { x: 0, y: 1 };
    expect(cosineSimilarity(a, b)).toBeCloseTo(0);
    expect(cosineDistance(a, b)).toBeCloseTo(1);
  });

  it("is -1 (distance 2) for opposite vectors", () => {
    const a = { x: 2, y: 3 };
    const b = { x: -2, y: -3 };
    expect(cosineSimilarity(a, b)).toBeCloseTo(-1);
    expect(cosineDistance(a, b)).toBeCloseTo(2);
  });
});
