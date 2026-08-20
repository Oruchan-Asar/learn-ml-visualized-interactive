import { describe, it, expect } from "vitest";
import { SCOREBOARD, BEST_VALIDATION_ACCURACY } from "@/lib/math-core/capstone-pipeline";

function entry(key: string) {
  const e = SCOREBOARD.find((s) => s.key === key);
  if (!e) throw new Error(`missing scoreboard entry ${key}`);
  return e;
}

describe("the four models reproduce the exact numbers each was tested with in its own chapter", () => {
  it("depth-1 tree: 80% train, 100% validation (Chapter 8)", () => {
    expect(entry("depth1").trainAccuracy).toBeCloseTo(0.8, 10);
    expect(entry("depth1").validationAccuracy).toBeCloseTo(1, 10);
  });

  it("depth-6 overfit tree: 96% train, 83.3% validation (Chapter 8's cautionary example)", () => {
    expect(entry("depth6").trainAccuracy).toBeCloseTo(0.96, 10);
    expect(entry("depth6").validationAccuracy).toBeCloseTo(20 / 24, 10);
  });

  it("bagged forest: 88% train, 91.7% validation (Chapter 9) — beats the single overfit tree", () => {
    expect(entry("bagging").trainAccuracy).toBeCloseTo(0.88, 10);
    expect(entry("bagging").validationAccuracy).toBeCloseTo(22 / 24, 10);
    expect(entry("bagging").validationAccuracy).toBeGreaterThan(entry("depth6").validationAccuracy);
  });

  it("boosting: 80% train, 100% validation — its first stump is identical to the depth-1 tree's split", () => {
    expect(entry("boosting").trainAccuracy).toBeCloseTo(0.8, 10);
    expect(entry("boosting").validationAccuracy).toBeCloseTo(1, 10);
  });
});

describe("BEST_VALIDATION_ACCURACY is the tied maximum, reached by two different techniques", () => {
  it("equals 100%, achieved by both depth-1 tree and boosting", () => {
    expect(BEST_VALIDATION_ACCURACY).toBeCloseTo(1, 10);
    expect(entry("depth1").validationAccuracy).toBeCloseTo(BEST_VALIDATION_ACCURACY, 10);
    expect(entry("boosting").validationAccuracy).toBeCloseTo(BEST_VALIDATION_ACCURACY, 10);
  });

  it("the overfit tree and bagging both fall short of it", () => {
    expect(entry("depth6").validationAccuracy).toBeLessThan(BEST_VALIDATION_ACCURACY);
    expect(entry("bagging").validationAccuracy).toBeLessThan(BEST_VALIDATION_ACCURACY);
  });
});
