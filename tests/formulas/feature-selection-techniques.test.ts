import { describe, expect, it } from "vitest";
import { FEATURES, TARGET, correlation, relevanceScore, selectionScore, variance, MAX_SCORE } from "@/lib/math-core/feature-selection-techniques";

const byName = (name: string) => FEATURES.find((f) => f.name === name)!;

describe("variance flags the useless feature before correlation even runs", () => {
  it("classroomNumber never varies — variance is exactly 0", () => {
    expect(variance(byName("classroomNumber").values)).toBe(0);
  });

  it("every other feature has nonzero variance", () => {
    expect(variance(byName("hoursStudied").values)).toBeGreaterThan(0);
    expect(variance(byName("shoeSize").values)).toBeGreaterThan(0);
    expect(variance(byName("sleepHours").values)).toBeGreaterThan(0);
    expect(variance(byName("luckyNumber").values)).toBeGreaterThan(0);
  });
});

describe("correlation with the target, worked by hand", () => {
  it("hoursStudied is a perfect predictor: r = 1", () => {
    expect(correlation(byName("hoursStudied").values, TARGET)).toBeCloseTo(1, 10);
  });

  it("a zero-variance feature has correlation 0, not NaN", () => {
    expect(correlation(byName("classroomNumber").values, TARGET)).toBe(0);
  });

  it("shoeSize: sum of cross-products 7 over sqrt(70*17.5)=35 gives r = 0.2", () => {
    expect(correlation(byName("shoeSize").values, TARGET)).toBeCloseTo(0.2, 10);
  });

  it("sleepHours: sum of cross-products 42 over sqrt(70*70)=70 gives r = 0.6", () => {
    expect(correlation(byName("sleepHours").values, TARGET)).toBeCloseTo(0.6, 10);
  });
});

describe("relevance score is R^2 — always non-negative, even for a negative correlation", () => {
  it("hoursStudied scores 1.0", () => {
    expect(relevanceScore(byName("hoursStudied"))).toBeCloseTo(1, 10);
  });

  it("classroomNumber scores exactly 0", () => {
    expect(relevanceScore(byName("classroomNumber"))).toBe(0);
  });

  it("luckyNumber has negative correlation but positive (squared) relevance", () => {
    expect(correlation(byName("luckyNumber").values, TARGET)).toBeLessThan(0);
    expect(relevanceScore(byName("luckyNumber"))).toBeGreaterThan(0);
  });
});

describe("selection score sums relevance across the chosen subset", () => {
  it("selecting nothing scores 0", () => {
    expect(selectionScore([])).toBe(0);
  });

  it("adding the zero-variance feature never changes the score", () => {
    const without = selectionScore(["hoursStudied", "shoeSize"]);
    const withUseless = selectionScore(["hoursStudied", "shoeSize", "classroomNumber"]);
    expect(withUseless).toBeCloseTo(without, 10);
  });

  it("MAX_SCORE is exactly the sum over every nonzero-variance feature", () => {
    const total = selectionScore(["hoursStudied", "shoeSize", "sleepHours", "luckyNumber"]);
    expect(MAX_SCORE).toBeCloseTo(total, 10);
    expect(MAX_SCORE).toBeCloseTo(1 + 0.04 + 0.36 + 0.1379591836734694, 8);
  });
});
