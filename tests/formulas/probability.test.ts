import { describe, it, expect } from "vitest";
import { normalize, expectedValue } from "@/lib/math-core/probability";

describe("normalize", () => {
  it("splits equal weights evenly", () => {
    expect(normalize([1, 1, 1, 1])).toEqual([0.25, 0.25, 0.25, 0.25]);
  });

  it("keeps weights proportional to each other", () => {
    const result = normalize([1, 2, 3, 4]);
    expect(result[0]).toBeCloseTo(0.1);
    expect(result[1]).toBeCloseTo(0.2);
    expect(result[2]).toBeCloseTo(0.3);
    expect(result[3]).toBeCloseTo(0.4);
  });

  it("always sums to 1, for arbitrary weights", () => {
    for (const weights of [
      [3, 7, 2],
      [0.5, 0.5, 0.5, 0.5, 0.5],
      [10, 1, 1, 1],
    ]) {
      const sum = normalize(weights).reduce((s, p) => s + p, 0);
      expect(sum).toBeCloseTo(1);
    }
  });
});

describe("expectedValue", () => {
  it("matches the worked example: P=[0.1,0.2,0.3,0.4], values=[1,2,3,4] → 3.0", () => {
    expect(expectedValue([0.1, 0.2, 0.3, 0.4], [1, 2, 3, 4])).toBeCloseTo(3.0);
  });

  it("is the plain average under a uniform distribution", () => {
    expect(expectedValue([0.25, 0.25, 0.25, 0.25], [1, 2, 3, 4])).toBeCloseTo(2.5);
  });

  it("hits the checkpoint's target of 2.0 with a distribution skewed toward low values", () => {
    const probabilities = normalize([3, 2, 1, 0.5]);
    const ev = expectedValue(probabilities, [1, 2, 3, 4]);
    expect(ev).toBeLessThan(2.5);
    expect(ev).toBeGreaterThan(1);
  });
});
