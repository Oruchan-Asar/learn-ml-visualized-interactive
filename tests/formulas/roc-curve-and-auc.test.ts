import { describe, expect, it } from "vitest";
import { rocCurve, auc, accuracyAtThreshold } from "@/lib/math-core/roc-curve-and-auc";

describe("sweeping every threshold traces the ROC curve exactly", () => {
  const curve = rocCurve();

  it("starts at (0,0) and ends at (1,1) — no threshold, then every point predicted positive", () => {
    expect(curve[0].fpr).toBe(0);
    expect(curve[0].tpr).toBe(0);
    expect(curve[curve.length - 1].fpr).toBe(1);
    expect(curve[curve.length - 1].tpr).toBe(1);
  });

  it("threshold=0.6 catches 2 of 3 positives and 1 of 3 negatives", () => {
    const point = curve.find((p) => p.threshold === 0.6);
    expect(point?.tpr).toBeCloseTo(2 / 3, 10);
    expect(point?.fpr).toBeCloseTo(1 / 3, 10);
  });

  it("threshold=0.4 catches every positive at the cost of 1 false positive", () => {
    const point = curve.find((p) => p.threshold === 0.4);
    expect(point?.tpr).toBe(1);
    expect(point?.fpr).toBeCloseTo(1 / 3, 10);
  });
});

describe("AUC integrates the whole curve into one threshold-independent number", () => {
  it("is exactly 8/9 for this dataset", () => {
    expect(auc()).toBeCloseTo(8 / 9, 10);
  });

  it("a perfect classifier (no overlap) would score exactly 1.0 — this one falls short because of the one overlapping pair", () => {
    expect(auc()).toBeLessThan(1);
    expect(auc()).toBeGreaterThan(0.5);
  });
});

describe("accuracy at one fixed threshold tells a much narrower story", () => {
  it("at threshold 0.5, accuracy is only 4/6 even though AUC is much higher", () => {
    expect(accuracyAtThreshold(0.5)).toBeCloseTo(2 / 3, 10);
  });
});
