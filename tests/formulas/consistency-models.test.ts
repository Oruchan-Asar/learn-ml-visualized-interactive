import { describe, it, expect } from "vitest";
import { consistencyFunction, CANDIDATES, PAIRS } from "@/lib/math-core/consistency-models";

describe("consistencyFunction", () => {
  it("matches the hand-computed value at t=0.3 for pair 0", () => {
    // x_0.3 = 0.7(-2) + 0.3(5) = 0.1; f = 0.1 + 0.7(7) = 5
    expect(consistencyFunction(0.3, PAIRS[0])).toBeCloseTo(5, 10);
  });

  it("matches the hand-computed value at t=0.8 for pair 0", () => {
    // x_0.8 = 0.2(-2) + 0.8(5) = 3.6; f = 3.6 + 0.2(7) = 5
    expect(consistencyFunction(0.8, PAIRS[0])).toBeCloseTo(5, 10);
  });

  it("always equals x1, for any t, on every pair — self-consistency", () => {
    for (const pair of PAIRS) {
      for (const t of [0, 0.1, 0.37, 0.5, 0.72, 0.99, 1]) {
        expect(consistencyFunction(t, pair)).toBeCloseTo(pair.x1, 10);
      }
    }
  });

  it("two different t's on the same trajectory agree exactly with each other", () => {
    for (const pair of PAIRS) {
      expect(consistencyFunction(0.15, pair)).toBeCloseTo(consistencyFunction(0.85, pair), 10);
    }
  });
});

describe("CANDIDATES", () => {
  it("exactly one candidate's consistency output is negative", () => {
    const outputs = CANDIDATES.map((c) => consistencyFunction(c.t, PAIRS[c.pairIndex]));
    expect(outputs).toEqual([5, -7, 4]);
    const negativeCount = outputs.filter((v) => v < 0).length;
    expect(negativeCount).toBe(1);
  });
});
