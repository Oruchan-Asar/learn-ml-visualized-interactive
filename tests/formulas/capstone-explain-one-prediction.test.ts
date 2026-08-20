import { describe, expect, it } from "vitest";
import {
  decisionValue,
  isApproved,
  saliency,
  NORM,
  nearestCounterfactual,
  counterfactualDelta,
  shapValue,
  FEATURE_KEYS,
  predict,
  INSTANCE,
  THRESHOLD,
} from "@/lib/math-core/capstone-explain-one-prediction";

describe("the same linear model, reframed as an approval classifier at threshold 500", () => {
  it("this instance predicts 445, below the 500 threshold — denied", () => {
    expect(predict(INSTANCE)).toBe(445);
    expect(decisionValue()).toBe(445 - THRESHOLD);
    expect(isApproved()).toBe(false);
  });
});

describe("saliency for a linear model is just |weight| — constant, ignoring the instance entirely", () => {
  it("equals the raw weight magnitudes regardless of feature values", () => {
    expect(saliency("size")).toBe(15);
    expect(saliency("age")).toBe(2);
    expect(saliency("distance")).toBe(5);
    expect(saliency("renovated")).toBe(20);
  });

  it("is identical for the instance and for the baseline house — saliency can't tell them apart", () => {
    for (const k of FEATURE_KEYS) expect(saliency(k)).toBe(saliency(k));
  });
});

describe("SHAP still explains the continuous prediction, not the threshold decision", () => {
  it("size contributes 75 to the predicted price, same as Chapter 6", () => {
    expect(shapValue("size")).toBe(75);
  });
});

describe("the counterfactual for the approval decision", () => {
  it("norm is sqrt(654), an ordinary (non-clean) 4D vector length", () => {
    expect(NORM).toBeCloseTo(Math.sqrt(654), 8);
  });

  it("the counterfactual point sits exactly on the threshold-500 boundary", () => {
    const cf = nearestCounterfactual();
    expect(decisionValue(cf)).toBeCloseTo(0, 8);
  });

  it("size must rise by about 1.26 and renovated by about 1.68 to reach that boundary", () => {
    const delta = counterfactualDelta();
    expect(delta.size).toBeCloseTo(1.2615, 3);
    expect(delta.renovated).toBeCloseTo(1.682, 3);
  });

  it("the naive continuous solution pushes the binary 'renovated' feature past 1 — infeasible for a real 0/1 feature", () => {
    const cf = nearestCounterfactual();
    expect(cf.renovated).toBeGreaterThan(1);
  });
});
