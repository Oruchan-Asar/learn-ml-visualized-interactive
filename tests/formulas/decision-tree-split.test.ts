import { describe, it, expect } from "vitest";
import { SPLIT_DATA_POINTS, evaluateSplit, bestSplit } from "@/lib/math-core/decision-tree-split";

describe("evaluateSplit on the fixed dataset (6 A's, 4 B's)", () => {
  it("parent entropy matches -(0.6 log2 0.6 + 0.4 log2 0.4)", () => {
    const { parentEntropy } = evaluateSplit(SPLIT_DATA_POINTS, 5.5);
    const handComputed = -(0.6 * Math.log2(0.6) + 0.4 * Math.log2(0.4));
    expect(parentEntropy).toBeCloseTo(handComputed, 10);
    expect(parentEntropy).toBeCloseTo(0.971, 3);
  });

  it("threshold 5.5 sends {1..5} left (all A, pure) and {6..10} right (4B, 1A)", () => {
    const result = evaluateSplit(SPLIT_DATA_POINTS, 5.5);
    expect(result.leftCount).toBe(5);
    expect(result.rightCount).toBe(5);
    expect(result.leftEntropy).toBeCloseTo(0, 10);
    const rightHandComputed = -(0.8 * Math.log2(0.8) + 0.2 * Math.log2(0.2));
    expect(result.rightEntropy).toBeCloseTo(rightHandComputed, 10);
    expect(result.informationGain).toBeCloseTo(0.60999, 4);
  });

  it("threshold 4.5 gives a smaller information gain than 5.5", () => {
    const at4_5 = evaluateSplit(SPLIT_DATA_POINTS, 4.5);
    const at5_5 = evaluateSplit(SPLIT_DATA_POINTS, 5.5);
    expect(at4_5.informationGain).toBeLessThan(at5_5.informationGain);
    expect(at4_5.informationGain).toBeCloseTo(0.41997, 4);
  });

  it("a threshold with no separating power (right in the middle of one class) gains little", () => {
    const result = evaluateSplit(SPLIT_DATA_POINTS, 6.5);
    expect(result.informationGain).toBeLessThan(0.3);
  });
});

describe("bestSplit finds the unique global optimum", () => {
  it("picks threshold 5.5 as the best among all candidate midpoints", () => {
    const { threshold, result } = bestSplit(SPLIT_DATA_POINTS);
    expect(threshold).toBe(5.5);
    expect(result.informationGain).toBeCloseTo(0.60999, 4);
  });

  it("every other candidate threshold scores strictly lower", () => {
    const { threshold: bestThreshold, result: bestResult } = bestSplit(SPLIT_DATA_POINTS);
    const xs = [...new Set(SPLIT_DATA_POINTS.map((p) => p.x))].sort((a, b) => a - b);
    for (let i = 0; i < xs.length - 1; i++) {
      const t = (xs[i] + xs[i + 1]) / 2;
      if (t === bestThreshold) continue;
      expect(evaluateSplit(SPLIT_DATA_POINTS, t).informationGain).toBeLessThan(bestResult.informationGain);
    }
  });
});
