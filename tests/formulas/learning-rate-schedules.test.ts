import { describe, it, expect } from "vitest";
import {
  constantLR,
  stepDecayLR,
  warmupCosineLR,
  trajectory,
  loss,
  maxLoss,
  X0,
  BASE_LR,
  TOTAL_STEPS,
  WARMUP_STEPS,
  TARGET_LOSS,
  OVERSHOOT_TOLERANCE,
} from "@/lib/math-core/learning-rate-schedules";

describe("each schedule's rate matches hand computation", () => {
  it("constant is flat at BASE_LR regardless of t", () => {
    expect(constantLR(0)).toBe(BASE_LR);
    expect(constantLR(11)).toBe(BASE_LR);
  });

  it("step decay halves every 4 steps: 1.2, 1.2, 1.2, 1.2, 0.6, ..., 0.3, ...", () => {
    for (let t = 0; t < 4; t++) expect(stepDecayLR(t)).toBeCloseTo(1.2, 10);
    for (let t = 4; t < 8; t++) expect(stepDecayLR(t)).toBeCloseTo(0.6, 10);
    for (let t = 8; t < 12; t++) expect(stepDecayLR(t)).toBeCloseTo(0.3, 10);
  });

  it("warmup ramps 0 -> BASE_LR linearly over WARMUP_STEPS, hitting BASE_LR exactly at t = WARMUP_STEPS", () => {
    expect(warmupCosineLR(0)).toBeCloseTo(0, 10);
    expect(warmupCosineLR(1)).toBeCloseTo(0.3, 10);
    expect(warmupCosineLR(2)).toBeCloseTo(0.6, 10);
    expect(warmupCosineLR(3)).toBeCloseTo(0.9, 10);
    expect(warmupCosineLR(WARMUP_STEPS)).toBeCloseTo(BASE_LR, 10);
  });
});

describe("the toy trajectory x_{t+1} = x_t(1 - 2*lr(t)) matches hand computation for the first few steps", () => {
  it("constant LR (too large): x0=10 -> x1=-14 in one step", () => {
    const xs = trajectory(constantLR, 1);
    expect(xs[0]).toBe(X0);
    expect(xs[1]).toBeCloseTo(-14, 10);
  });

  it("warmup: lr(0)=0 leaves x completely unchanged for the first step", () => {
    const xs = trajectory(warmupCosineLR, 1);
    expect(xs[1]).toBeCloseTo(10, 10);
  });

  it("warmup: by the second step (lr=0.3), x drops from 10 to 4", () => {
    const xs = trajectory(warmupCosineLR, 2);
    expect(xs[2]).toBeCloseTo(4, 10);
  });
});

describe("a schedule that never reduces the rate diverges; ones that do eventually shrink the loss", () => {
  it("constant LR's loss explodes far past the target by the step budget", () => {
    const xs = trajectory(constantLR, TOTAL_STEPS);
    expect(loss(xs[TOTAL_STEPS])).toBeGreaterThan(1000);
  });

  it("both step decay and warmup+cosine eventually push the loss under the target", () => {
    expect(loss(trajectory(stepDecayLR, TOTAL_STEPS)[TOTAL_STEPS])).toBeLessThan(TARGET_LOSS);
    expect(loss(trajectory(warmupCosineLR, TOTAL_STEPS)[TOTAL_STEPS])).toBeLessThan(TARGET_LOSS);
  });
});

describe("warmup avoids ever overshooting the starting loss; step decay does not", () => {
  it("constant and step decay both overshoot far past OVERSHOOT_TOLERANCE times the starting loss", () => {
    const startingLoss = loss(X0);
    expect(maxLoss(trajectory(constantLR, TOTAL_STEPS))).toBeGreaterThan(startingLoss * OVERSHOOT_TOLERANCE);
    expect(maxLoss(trajectory(stepDecayLR, TOTAL_STEPS))).toBeGreaterThan(startingLoss * OVERSHOOT_TOLERANCE);
  });

  it("warmup + cosine never exceeds OVERSHOOT_TOLERANCE times the starting loss, the whole way through", () => {
    const startingLoss = loss(X0);
    expect(maxLoss(trajectory(warmupCosineLR, TOTAL_STEPS))).toBeLessThanOrEqual(startingLoss * OVERSHOOT_TOLERANCE);
  });
});
