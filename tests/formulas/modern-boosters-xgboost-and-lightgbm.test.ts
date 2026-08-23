import { describe, it, expect } from "vitest";
import {
  ROUND2_GRADIENTS,
  ROUND2_THRESHOLD,
  leafGradientSum,
  leafSize,
  newtonLeafValue,
  xgboostLeafValue,
  xgboostPredict,
} from "@/lib/math-core/modern-boosters-xgboost-and-lightgbm";

describe("round 2 gradients match GBM's round-2 residuals, negated", () => {
  it("g_i = F1(x_i) - y_i = [0.5, -0.5, 2, 1, -3]", () => {
    ROUND2_GRADIENTS.forEach((g, i) => expect(g).toBeCloseTo([0.5, -0.5, 2, 1, -3][i], 10));
  });
});

describe("leaf gradient sums and sizes at the reused threshold (x = 4.5)", () => {
  it("threshold is exactly 4.5", () => {
    expect(ROUND2_THRESHOLD).toBeCloseTo(4.5, 10);
  });

  it("left leaf: 4 points, G = 3", () => {
    expect(leafSize(ROUND2_THRESHOLD, "left")).toBe(4);
    expect(leafGradientSum(ROUND2_THRESHOLD, "left")).toBeCloseTo(3, 10);
  });

  it("right leaf: 1 point, G = -3", () => {
    expect(leafSize(ROUND2_THRESHOLD, "right")).toBe(1);
    expect(leafGradientSum(ROUND2_THRESHOLD, "right")).toBeCloseTo(-3, 10);
  });
});

describe("at lambda=0, hessian=1, the Newton leaf value exactly reproduces plain GBM's mean-of-residuals leaf", () => {
  it("left leaf value is -0.75, right leaf value is 3", () => {
    expect(xgboostLeafValue(ROUND2_THRESHOLD, "left", 0, 1)).toBeCloseTo(-0.75, 10);
    expect(xgboostLeafValue(ROUND2_THRESHOLD, "right", 0, 1)).toBeCloseTo(3, 10);
  });
});

describe("regularization (lambda) shrinks both leaf values toward zero", () => {
  it("lambda=1, hessian=1: left = -0.6, right = 1.5", () => {
    expect(xgboostLeafValue(ROUND2_THRESHOLD, "left", 1, 1)).toBeCloseTo(-0.6, 10);
    expect(xgboostLeafValue(ROUND2_THRESHOLD, "right", 1, 1)).toBeCloseTo(1.5, 10);
  });

  it("shrinkage is monotonic in lambda", () => {
    const leftAt = (lambda: number) => Math.abs(xgboostLeafValue(ROUND2_THRESHOLD, "left", lambda, 1));
    expect(leftAt(1)).toBeLessThan(leftAt(0));
    expect(leftAt(2)).toBeLessThan(leftAt(1));
  });
});

describe("a larger toy Hessian also shrinks the leaf value, even with no regularization", () => {
  it("lambda=0, hessian=2: left = -0.375, right = 1.5", () => {
    expect(xgboostLeafValue(ROUND2_THRESHOLD, "left", 0, 2)).toBeCloseTo(-0.375, 10);
    expect(xgboostLeafValue(ROUND2_THRESHOLD, "right", 0, 2)).toBeCloseTo(1.5, 10);
  });

  it("lambda=1, hessian=2: left = -1/3, right = 1", () => {
    expect(xgboostLeafValue(ROUND2_THRESHOLD, "left", 1, 2)).toBeCloseTo(-1 / 3, 10);
    expect(xgboostLeafValue(ROUND2_THRESHOLD, "right", 1, 2)).toBeCloseTo(1, 10);
  });
});

describe("newtonLeafValue is the raw formula -G/(H+lambda)", () => {
  it("matches by hand for a few (G, H, lambda) triples", () => {
    expect(newtonLeafValue(3, 4, 0)).toBeCloseTo(-0.75, 10);
    expect(newtonLeafValue(-3, 1, 1)).toBeCloseTo(1.5, 10);
    expect(newtonLeafValue(10, 0, 5)).toBeCloseTo(-2, 10);
  });
});

describe("xgboostPredict combines F1 with the regularized leaf value", () => {
  it("at lambda=0, hessian=1 it matches plain GBM's round-2 prediction exactly", () => {
    const expected = [0.75, 0.75, 9.25, 9.25, 13];
    [1, 2, 3, 4, 5].forEach((x, i) => {
      expect(xgboostPredict(x, 0, 1)).toBeCloseTo(expected[i], 10);
    });
  });

  it("at lambda=1, hessian=1 predictions shrink back toward F1 (less aggressive update)", () => {
    // F1 at x=1 is 1.5; plain GBM round 2 pulls it to 0.75; regularized should land between.
    const regularized = xgboostPredict(1, 1, 1);
    expect(regularized).toBeCloseTo(0.9, 10);
    expect(regularized).toBeGreaterThan(0.75);
    expect(regularized).toBeLessThan(1.5);
  });
});
