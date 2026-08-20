import { describe, expect, it } from "vitest";
import {
  predict,
  BASELINE_FEATURES,
  BASELINE_PREDICTION,
  INSTANCE,
  shapValue,
  allShapValues,
  FEATURE_KEYS,
} from "@/lib/math-core/shap-linear";

describe("the linear price model", () => {
  it("baseline house predicts 320", () => {
    expect(predict(BASELINE_FEATURES)).toBe(320);
  });

  it("the specific instance predicts 445", () => {
    expect(predict(INSTANCE)).toBe(445);
  });
});

describe("closed-form SHAP values for a linear model", () => {
  it("size contributes 75, age 20, distance 10, renovated 20", () => {
    expect(shapValue("size")).toBe(75);
    expect(shapValue("age")).toBe(20);
    expect(shapValue("distance")).toBe(10);
    expect(shapValue("renovated")).toBe(20);
  });

  it("satisfies the efficiency axiom exactly: baseline + sum(SHAP) = prediction", () => {
    const values = allShapValues();
    const sum = FEATURE_KEYS.reduce((s, k) => s + values[k], 0);
    expect(BASELINE_PREDICTION + sum).toBe(predict(INSTANCE));
  });

  it("a feature identical to its baseline value contributes exactly zero", () => {
    const atBaseline = { ...INSTANCE, age: BASELINE_FEATURES.age };
    expect(shapValue("age", atBaseline)).toBeCloseTo(0, 10);
  });

  it("a negative weight times a below-baseline value gives a positive contribution", () => {
    // age's weight is negative, and this instance's age (5) is below baseline (15) — younger is better.
    expect(shapValue("age")).toBeGreaterThan(0);
  });
});
