import { describe, it, expect } from "vitest";
import { X_POINTS, polyFit } from "@/lib/math-core/bias-variance";
import { ridgeFit, lassoFit, REG_DEGREE, REG_YS } from "@/lib/math-core/regularization";

describe("ridgeFit at lambda=0 matches plain least squares", () => {
  it("reduces to the same coefficients as polyFit", () => {
    const ols = polyFit(X_POINTS, REG_YS, REG_DEGREE);
    const ridge = ridgeFit(X_POINTS, REG_YS, REG_DEGREE, 0);
    ols.forEach((c, i) => expect(ridge[i]).toBeCloseTo(c, 8));
  });
});

describe("ridge coefficients shrink but never hit exactly zero", () => {
  it("the x¹ coefficient shrinks as lambda grows, matching the hand-checked value at lambda=1", () => {
    const ridge = ridgeFit(X_POINTS, REG_YS, REG_DEGREE, 1);
    expect(ridge[1]).toBeCloseTo(0.2432, 3);
    expect(ridge[1]).not.toBe(0);
  });

  it("stays nonzero even at a large lambda", () => {
    const ridge = ridgeFit(X_POINTS, REG_YS, REG_DEGREE, 10);
    expect(Math.abs(ridge[1])).toBeGreaterThan(0.01);
  });
});

describe("lassoFit at lambda=0 approximately matches plain least squares", () => {
  it("converges close to the same coefficients as polyFit given enough iterations", () => {
    const ols = polyFit(X_POINTS, REG_YS, REG_DEGREE);
    const lasso = lassoFit(X_POINTS, REG_YS, REG_DEGREE, 0, 2000);
    ols.forEach((c, i) => expect(lasso[i]).toBeCloseTo(c, 2));
  });
});

describe("lasso drives coefficients to exactly zero — the sparsity L2 never produces", () => {
  it("zeroes the x² coefficient (index 2) already at a tiny lambda=0.01", () => {
    const lasso = lassoFit(X_POINTS, REG_YS, REG_DEGREE, 0.01);
    expect(lasso[2]).toBe(0);
  });

  it("zeroes both the x¹ and x² coefficients by lambda=0.2, while the intercept and higher terms survive", () => {
    const lasso = lassoFit(X_POINTS, REG_YS, REG_DEGREE, 0.2);
    expect(lasso[1]).toBe(0);
    expect(lasso[2]).toBe(0);
    expect(lasso[0]).not.toBe(0);
    expect(lasso[3]).not.toBe(0);
    expect(lasso[4]).not.toBe(0);
  });

  it("ridge at the same lambda=0.2 has NOT zeroed the x¹ coefficient — the contrast with lasso", () => {
    const ridge = ridgeFit(X_POINTS, REG_YS, REG_DEGREE, 0.2);
    expect(Math.abs(ridge[1])).toBeGreaterThan(0.1);
  });
});
