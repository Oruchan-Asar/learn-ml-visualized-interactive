import { describe, it, expect } from "vitest";
import {
  DATA_POINTS,
  OUTLIER_DATA_POINTS,
  predict,
  sumSquaredError,
  meanSquaredError,
  sumAbsoluteError,
  meanAbsoluteError,
} from "@/lib/math-core/linear-regression";

describe("predict", () => {
  it("computes wx + b", () => {
    expect(predict(2, 1, 3)).toBeCloseTo(7);
    expect(predict(0, 5, 100)).toBeCloseTo(5);
  });
});

describe("sumSquaredError on the chapter's dataset", () => {
  it("matches the least-squares optimum: w=1.92, b=1.3 → SSE ≈ 0.524", () => {
    // Hand-derived via the normal equations: Sxy/Sxx and mean_y - w*mean_x.
    expect(sumSquaredError(DATA_POINTS, 1.92, 1.3)).toBeCloseTo(0.524, 2);
  });

  it("is comfortably under the checkpoint's threshold at a clean near-optimal fit (w=2, b=1)", () => {
    expect(sumSquaredError(DATA_POINTS, 2, 1)).toBeCloseTo(0.83, 2);
  });

  it("is far worse for a flat line at the starting height (y=5) than for a good fit", () => {
    const flat = sumSquaredError(DATA_POINTS, 0, 5);
    const good = sumSquaredError(DATA_POINTS, 2, 1);
    expect(flat).toBeGreaterThan(good * 10);
  });

  it("meanSquaredError is sumSquaredError divided by the point count", () => {
    const sse = sumSquaredError(DATA_POINTS, 2, 1);
    expect(meanSquaredError(DATA_POINTS, 2, 1)).toBeCloseTo(sse / DATA_POINTS.length);
  });
});

describe("MSE vs MAE on the outlier dataset (chapter 2)", () => {
  it("matches the worked example at w=2,b=1: the outlier residual is 15, squared 225", () => {
    const outlier = OUTLIER_DATA_POINTS[5];
    expect(outlier).toEqual({ x: 2, y: 20 });
    const residual = outlier.y - predict(2, 1, outlier.x);
    expect(residual).toBeCloseTo(15);
    expect(residual * residual).toBeCloseTo(225);
  });

  it("matches the worked example's totals: SSE=225.83 (MSE≈37.64), sum|resid|=16.9 (MAE≈2.82)", () => {
    expect(sumSquaredError(OUTLIER_DATA_POINTS, 2, 1)).toBeCloseTo(225.83, 1);
    expect(meanSquaredError(OUTLIER_DATA_POINTS, 2, 1)).toBeCloseTo(37.64, 1);
    expect(sumAbsoluteError(OUTLIER_DATA_POINTS, 2, 1)).toBeCloseTo(16.9, 1);
    expect(meanAbsoluteError(OUTLIER_DATA_POINTS, 2, 1)).toBeCloseTo(2.82, 1);
  });

  it("passes the checkpoint's MAE threshold (4.0) at the good five-point fit despite the outlier", () => {
    expect(meanAbsoluteError(OUTLIER_DATA_POINTS, 2, 1)).toBeLessThan(4.0);
  });

  it("the outlier dominates SSE far more than it dominates the absolute-error sum", () => {
    const sse = sumSquaredError(OUTLIER_DATA_POINTS, 2, 1);
    const sae = sumAbsoluteError(OUTLIER_DATA_POINTS, 2, 1);
    const outlierSquareShare = 225 / sse;
    const outlierAbsShare = 15 / sae;
    expect(outlierSquareShare).toBeGreaterThan(outlierAbsShare);
    expect(outlierSquareShare).toBeGreaterThan(0.99);
  });
});
