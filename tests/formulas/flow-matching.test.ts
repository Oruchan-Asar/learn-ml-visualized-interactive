import { describe, it, expect } from "vitest";
import { positionAt, velocity, euler, PAIRS } from "@/lib/math-core/flow-matching";

describe("positionAt", () => {
  it("matches the hand-computed midpoint for every pair", () => {
    expect(positionAt(0.5, PAIRS[0])).toBeCloseTo(1.5, 10);
    expect(positionAt(0.5, PAIRS[1])).toBeCloseTo(-2, 10);
    expect(positionAt(0.5, PAIRS[2])).toBeCloseTo(2, 10);
  });

  it("equals x0 at t=0 and x1 at t=1, for every pair", () => {
    for (const pair of PAIRS) {
      expect(positionAt(0, pair)).toBeCloseTo(pair.x0, 10);
      expect(positionAt(1, pair)).toBeCloseTo(pair.x1, 10);
    }
  });
});

describe("velocity", () => {
  it("matches x1 - x0 exactly for every pair", () => {
    expect(velocity(PAIRS[0])).toBe(7);
    expect(velocity(PAIRS[1])).toBe(-10);
    expect(velocity(PAIRS[2])).toBe(4);
  });
});

describe("euler", () => {
  it("lands exactly on x1 regardless of step count, because the true velocity is constant", () => {
    for (const pair of PAIRS) {
      for (const steps of [1, 2, 5, 50]) {
        expect(euler(pair, steps)).toBeCloseTo(pair.x1, 8);
      }
    }
  });

  it("a single giant step is exactly as accurate as many small ones", () => {
    const pair = PAIRS[0];
    expect(euler(pair, 1)).toBeCloseTo(euler(pair, 100), 8);
  });
});

describe("checkpoint fact: exactly one pair has a negative midpoint", () => {
  it("pair index 1 is the only one whose position at t=0.5 is negative", () => {
    const midpoints = PAIRS.map((p) => positionAt(0.5, p));
    const negativeIndices = midpoints.map((m, i) => (m < 0 ? i : -1)).filter((i) => i >= 0);
    expect(negativeIndices).toEqual([1]);
  });
});
