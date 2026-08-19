import { describe, it, expect } from "vitest";
import {
  crossEntropyLoss,
  crossEntropyLossDerivative,
  squaredErrorLoss,
  meanCrossEntropyLoss,
} from "@/lib/math-core/cross-entropy";

describe("crossEntropyLoss", () => {
  it("matches the worked example: y=1, p=0.1 → -ln(0.1) ≈ 2.303", () => {
    expect(crossEntropyLoss(1, 0.1)).toBeCloseTo(2.303, 3);
  });

  it("is -ln(0.5) at p=0.5 regardless of label (both terms coincide there)", () => {
    expect(crossEntropyLoss(1, 0.5)).toBeCloseTo(0.6931, 3);
    expect(crossEntropyLoss(0, 0.5)).toBeCloseTo(0.6931, 3);
  });

  it("approaches 0 as the prediction approaches certainty in the correct direction", () => {
    expect(crossEntropyLoss(1, 0.999)).toBeLessThan(0.01);
    expect(crossEntropyLoss(0, 0.001)).toBeLessThan(0.01);
  });

  it("is symmetric: loss for y=0 at p equals loss for y=1 at (1-p)", () => {
    for (const p of [0.1, 0.3, 0.7, 0.9]) {
      expect(crossEntropyLoss(0, p)).toBeCloseTo(crossEntropyLoss(1, 1 - p));
    }
  });

  it("hits the checkpoint's target: y=1, p≈0.9512 → loss ≈ 0.05", () => {
    expect(crossEntropyLoss(1, 0.9512)).toBeCloseTo(0.05, 2);
  });

  it("grows far larger than squared error for a confidently wrong prediction", () => {
    const ce = crossEntropyLoss(1, 0.1);
    const se = squaredErrorLoss(1, 0.1);
    expect(se).toBeCloseTo(0.81);
    expect(ce).toBeGreaterThan(se * 2.5);
  });

  it("squared error stays bounded by 1 even at the most confidently wrong prediction", () => {
    expect(squaredErrorLoss(1, 0)).toBeCloseTo(1);
    expect(squaredErrorLoss(0, 1)).toBeCloseTo(1);
  });
});

describe("crossEntropyLossDerivative", () => {
  it("agrees with central-difference numerical differentiation", () => {
    const eps = 1e-6;
    for (const [y, p] of [
      [1, 0.3],
      [1, 0.8],
      [0, 0.2],
      [0, 0.6],
    ] as const) {
      const numeric = (crossEntropyLoss(y, p + eps) - crossEntropyLoss(y, p - eps)) / (2 * eps);
      expect(crossEntropyLossDerivative(y, p)).toBeCloseTo(numeric, 2);
    }
  });
});

describe("meanCrossEntropyLoss", () => {
  it("averages per-example loss across predictions", () => {
    const predictions = [0.9, 0.1];
    const labels: (0 | 1)[] = [1, 0];
    const expected = (crossEntropyLoss(1, 0.9) + crossEntropyLoss(0, 0.1)) / 2;
    expect(meanCrossEntropyLoss(predictions, labels)).toBeCloseTo(expected);
  });
});
