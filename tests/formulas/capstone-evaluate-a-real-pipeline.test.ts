import { describe, it, expect } from "vitest";
import { metricsAt, rankingAUC, foldAccuracies, thresholdGridSearch, bestThreshold, DEFAULT_THRESHOLD } from "@/lib/math-core/capstone-evaluate-a-real-pipeline";

describe("capstone-evaluate-a-real-pipeline", () => {
  it("the default threshold scores 70% accuracy but a much lower F1", () => {
    const m = metricsAt(DEFAULT_THRESHOLD);
    expect(m.accuracy).toBeCloseTo(0.7, 10);
    expect(m.precision).toBeCloseTo(2 / 3, 10);
    expect(m.recall).toBeCloseTo(0.8, 10);
    expect(m.f1).toBeCloseTo(8 / 11, 10);
  });

  it("ranking AUC is threshold-independent and disagrees with the point accuracy", () => {
    expect(rankingAUC()).toBeCloseTo(0.76, 10);
  });

  it("fold-by-fold accuracy reveals exactly which folds struggle, averaging back to the overall accuracy", () => {
    const folds = foldAccuracies();
    expect(folds.map((f) => f.accuracy)).toEqual([1, 0.5, 0.5, 0.5, 1]);
    const mean = folds.reduce((s, f) => s + f.accuracy, 0) / folds.length;
    expect(mean).toBeCloseTo(0.7, 10);
  });

  it("grid search covers every threshold that could change the prediction set", () => {
    const results = thresholdGridSearch();
    expect(results).toHaveLength(11);
    expect(results[0].threshold).toBe(Infinity);
    expect(results[0].f1).toBe(0);
  });

  it("the best threshold (0.3) beats the default threshold's F1", () => {
    const best = bestThreshold();
    expect(best.threshold).toBe(0.3);
    expect(best.f1).toBeCloseTo(10 / 13, 10);
    expect(best.f1).toBeGreaterThan(metricsAt(DEFAULT_THRESHOLD).f1);
  });
});
