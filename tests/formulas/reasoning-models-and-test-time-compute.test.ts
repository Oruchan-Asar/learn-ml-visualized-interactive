import { describe, it, expect } from "vitest";
import { BASE_ACCURACY, DECAY, accuracy, accuracyDerivative, computeCost, utility, bestCotLength } from "@/lib/math-core/reasoning-models-and-test-time-compute";

describe("accuracy", () => {
  it("at cotLength=0 equals BASE_ACCURACY", () => {
    expect(accuracy(0)).toBeCloseTo(BASE_ACCURACY, 10);
  });

  it("matches the hand-computed geometric decay: 1 - 0.8*0.8^L", () => {
    expect(accuracy(1)).toBeCloseTo(0.36, 10); // 1 - 0.8*0.8
    expect(accuracy(2)).toBeCloseTo(0.488, 10); // 1 - 0.8*0.64
    expect(accuracy(4)).toBeCloseTo(0.67232, 10);
  });

  it("keeps climbing but never reaches 1, even for very long chains of thought", () => {
    expect(accuracy(100)).toBeLessThan(1);
    expect(accuracy(100)).toBeGreaterThan(accuracy(50));
  });
});

describe("accuracyDerivative", () => {
  it("is always positive -- more reasoning steps never hurts accuracy in this model", () => {
    expect(accuracyDerivative(0)).toBeGreaterThan(0);
    expect(accuracyDerivative(10)).toBeGreaterThan(0);
  });

  it("shrinks as cotLength grows -- diminishing returns", () => {
    expect(accuracyDerivative(10)).toBeLessThan(accuracyDerivative(0));
  });
});

describe("computeCost", () => {
  it("is linear in cotLength", () => {
    expect(computeCost(5)).toBeCloseTo(0.1, 10);
    expect(computeCost(10)).toBeCloseTo(2 * computeCost(5), 10);
  });
});

describe("utility and bestCotLength", () => {
  it("utility peaks at cotLength=10 for the default cost weight", () => {
    expect(bestCotLength()).toBe(10);
    expect(utility(10)).toBeGreaterThan(utility(9));
    expect(utility(10)).toBeGreaterThan(utility(11));
  });

  it("a higher cost weight pulls the optimum toward shorter chains of thought", () => {
    expect(bestCotLength(30, 5)).toBeLessThan(bestCotLength(30, 1));
  });
});
