import { describe, it, expect } from "vitest";
import {
  GBM_POINTS,
  GBM_F0,
  GBM_ROUNDS,
  gbmPredict,
  gbmResiduals,
  totalSse,
  bestStump,
} from "@/lib/math-core/gradient-boosting-machines";

describe("F0 is the plain mean of y — the boosting-free baseline", () => {
  it("is exactly 6.6", () => {
    expect(GBM_F0).toBeCloseTo(6.6, 10);
  });
});

describe("round 1 finds the single best split of the raw residuals", () => {
  it("splits at x = 2.5, predicting -5.1 left and 3.4 right", () => {
    const round1 = GBM_ROUNDS[0];
    expect(round1.stump.threshold).toBeCloseTo(2.5, 10);
    expect(round1.stump.leftValue).toBeCloseTo(-5.1, 10);
    expect(round1.stump.rightValue).toBeCloseTo(3.4, 10);
  });

  it("leaves SSE at exactly 14.5, far below every other candidate split", () => {
    const xs = GBM_POINTS.map((p) => p.x);
    const residuals = GBM_POINTS.map((p) => p.y - GBM_F0);
    const best = bestStump(xs, residuals);
    expect(best.sse).toBeCloseTo(14.5, 10);
    // Every other candidate threshold (1.5, 3.5, 4.5) does strictly worse.
    for (const t of [1.5, 3.5, 4.5]) {
      const left = residuals.filter((_, i) => xs[i] < t);
      const right = residuals.filter((_, i) => xs[i] >= t);
      const lm = left.reduce((a, b) => a + b, 0) / left.length;
      const rm = right.reduce((a, b) => a + b, 0) / right.length;
      const sse =
        left.reduce((s, v) => s + (v - lm) ** 2, 0) + right.reduce((s, v) => s + (v - rm) ** 2, 0);
      expect(sse).toBeGreaterThan(best.sse + 1);
    }
  });
});

describe("combined prediction after round 1", () => {
  it("matches F0 + stump1 exactly at every point", () => {
    const predictions = GBM_POINTS.map((p) => gbmPredict(GBM_F0, GBM_ROUNDS, 1, p.x));
    expect(predictions).toEqual([1.5, 1.5, 10, 10, 10]);
  });

  it("round-1 residuals are exactly [-0.5, 0.5, -2, -1, 3], SSE = 14.5", () => {
    const residuals = gbmResiduals(GBM_POINTS, GBM_F0, GBM_ROUNDS, 1);
    residuals.forEach((r, i) => expect(r).toBeCloseTo([-0.5, 0.5, -2, -1, 3][i], 10));
    expect(totalSse(residuals)).toBeCloseTo(14.5, 10);
  });
});

describe("round 2 fits a fresh stump to round 1's residuals", () => {
  it("splits at x = 4.5, predicting -0.75 left and 3 right", () => {
    const round2 = GBM_ROUNDS[1];
    expect(round2.stump.threshold).toBeCloseTo(4.5, 10);
    expect(round2.stump.leftValue).toBeCloseTo(-0.75, 10);
    expect(round2.stump.rightValue).toBeCloseTo(3, 10);
  });
});

describe("combined prediction after round 2 keeps converging toward y", () => {
  it("matches F1 + stump2 exactly: [0.75, 0.75, 9.25, 9.25, 13]", () => {
    const predictions = GBM_POINTS.map((p) => gbmPredict(GBM_F0, GBM_ROUNDS, 2, p.x));
    expect(predictions).toEqual([0.75, 0.75, 9.25, 9.25, 13]);
  });

  it("round-2 residuals are exactly [0.25, 1.25, -1.25, -0.25, 0], SSE = 3.25", () => {
    const residuals = gbmResiduals(GBM_POINTS, GBM_F0, GBM_ROUNDS, 2);
    residuals.forEach((r, i) => expect(r).toBeCloseTo([0.25, 1.25, -1.25, -0.25, 0][i], 10));
    expect(totalSse(residuals)).toBeCloseTo(3.25, 10);
  });

  it("total SSE strictly decreases round over round: 101.2 -> 14.5 -> 3.25", () => {
    const sse0 = totalSse(gbmResiduals(GBM_POINTS, GBM_F0, GBM_ROUNDS, 0));
    const sse1 = totalSse(gbmResiduals(GBM_POINTS, GBM_F0, GBM_ROUNDS, 1));
    const sse2 = totalSse(gbmResiduals(GBM_POINTS, GBM_F0, GBM_ROUNDS, 2));
    expect(sse0).toBeCloseTo(101.2, 10);
    expect(sse1).toBeCloseTo(14.5, 10);
    expect(sse2).toBeCloseTo(3.25, 10);
    expect(sse1).toBeLessThan(sse0);
    expect(sse2).toBeLessThan(sse1);
  });
});
