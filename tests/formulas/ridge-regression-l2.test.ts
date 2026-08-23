import { describe, it, expect } from "vitest";
import { ridgeFit, CORRELATION, dot, X1, X2 } from "@/lib/math-core/ridge-regression-l2";

describe("the two predictors are nearly collinear by construction", () => {
  it("has correlation above 0.99", () => {
    expect(CORRELATION).toBeGreaterThan(0.99);
    expect(CORRELATION).toBeCloseTo(0.9982953841253284, 10);
  });
});

describe("ridge at lambda=0 is plain OLS, and it's unstable", () => {
  it("gives opposite-signed weights despite both predictors being positively correlated with y", () => {
    const w = ridgeFit(0);
    expect(w.w1).toBeCloseTo(3.9285714285714284, 8);
    expect(w.w2).toBeCloseTo(-1.7142857142857142, 8);
    expect(w.w1).toBeGreaterThan(0);
    expect(w.w2).toBeLessThan(0);
  });
});

describe("a small penalty flips both weights positive", () => {
  it("at lambda=1, both weights are positive and much closer together", () => {
    const w = ridgeFit(1);
    expect(w.w1).toBeCloseTo(1.1163636363636364, 8);
    expect(w.w2).toBeCloseTo(0.8872727272727273, 8);
    expect(w.w1).toBeGreaterThan(0);
    expect(w.w2).toBeGreaterThan(0);
  });
});

describe("a large penalty splits credit almost evenly between the two collinear predictors", () => {
  it("at lambda=5, the weights are nearly equal", () => {
    const w = ridgeFit(5);
    expect(w.w1).toBeCloseTo(0.9399571122230165, 8);
    expect(w.w2).toBeCloseTo(0.9406719085060757, 8);
    expect(Math.abs(w.w1 - w.w2)).toBeLessThan(0.01);
  });

  it("neither weight ever hits exactly zero, even at the largest tested lambda", () => {
    const w = ridgeFit(6);
    expect(w.w1).not.toBe(0);
    expect(w.w2).not.toBe(0);
  });
});

describe("the sign-flip crossover happens between lambda=0.08 and 0.09", () => {
  it("w2 is still negative at 0.08 and positive by 0.1", () => {
    expect(ridgeFit(0.08).w2).toBeLessThan(0);
    expect(ridgeFit(0.1).w2).toBeGreaterThan(0);
  });
});

it("dot() computes the plain dot product", () => {
  expect(dot(X1, X2)).toBeCloseTo(32, 8);
  expect(dot(X1, X1)).toBe(30);
});
