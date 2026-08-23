import { describe, it, expect } from "vitest";
import { lassoFit, softThreshold } from "@/lib/math-core/lasso-regression-l1";
import { ridgeFit } from "@/lib/math-core/ridge-regression-l2";

describe("softThreshold", () => {
  it("shrinks values above the threshold toward zero", () => {
    expect(softThreshold(5, 2)).toBe(3);
    expect(softThreshold(-5, 2)).toBe(-3);
  });
  it("zeroes anything within the threshold band", () => {
    expect(softThreshold(1, 2)).toBe(0);
    expect(softThreshold(-1, 2)).toBe(0);
    expect(softThreshold(2, 2)).toBe(0);
  });
});

describe("lasso at lambda=0 matches OLS (matches ridge at lambda=0)", () => {
  it("converges to the same coefficients as ridgeFit(0)", () => {
    const lasso = lassoFit(0);
    const ridge = ridgeFit(0);
    expect(lasso.w1).toBeCloseTo(ridge.w1, 4);
    expect(lasso.w2).toBeCloseTo(ridge.w2, 4);
  });
});

describe("lasso drives the second predictor to exactly zero across a wide lambda range", () => {
  it("zeroes w2 already at lambda=0.03", () => {
    expect(lassoFit(0.03).w2).toBe(0);
  });
  it("keeps w2 at exactly zero at lambda=0.5", () => {
    const w = lassoFit(0.5);
    expect(w.w2).toBe(0);
    expect(w.w1).toBeCloseTo(2.033333333333333, 6);
  });
  it("still has w2 at exactly zero at lambda=0.75, LAMBDA_MAX", () => {
    expect(lassoFit(0.75).w2).toBe(0);
  });
});

describe("ridge at the same lambda never produces an exact zero — the contrast with lasso", () => {
  it("ridge(0.5) keeps both weights comfortably nonzero", () => {
    const ridge = ridgeFit(0.5);
    expect(Math.abs(ridge.w1)).toBeGreaterThan(0.1);
    expect(Math.abs(ridge.w2)).toBeGreaterThan(0.1);
  });
});
