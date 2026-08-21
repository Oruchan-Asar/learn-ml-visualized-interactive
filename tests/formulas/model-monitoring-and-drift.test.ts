import { describe, expect, it } from "vitest";
import {
  BIN_ACCURACIES,
  TRAIN_DIST,
  LIVE_DIST,
  weightedAccuracy,
  driftScore,
  DRIFT_ALERT_THRESHOLD,
  isDrifting,
  CANDIDATES,
} from "@/lib/math-core/model-monitoring-and-drift";

describe("model-monitoring-and-drift", () => {
  it("weighs each bin's fixed accuracy by how often it occurs", () => {
    expect(weightedAccuracy(TRAIN_DIST)).toBeCloseTo(0.84, 10);
    expect(BIN_ACCURACIES).toEqual([0.95, 0.85, 0.75]);
  });

  it("live traffic has drifted from train, yet lands on the exact same overall accuracy", () => {
    expect(weightedAccuracy(LIVE_DIST)).toBeCloseTo(0.84, 10);
    expect(TRAIN_DIST).not.toEqual(LIVE_DIST);
  });

  it("KL divergence between train and live is well above the alert threshold", () => {
    const score = driftScore(TRAIN_DIST, LIVE_DIST);
    expect(score).toBeCloseTo(0.12697904715521868, 10);
    expect(score).toBeGreaterThan(DRIFT_ALERT_THRESHOLD);
    expect(isDrifting(TRAIN_DIST, LIVE_DIST)).toBe(true);
  });

  it("has three unseen candidates for the checkpoint", () => {
    expect(CANDIDATES).toHaveLength(3);
  });

  it("candidate A: accuracy matches training exactly, but it has drifted the most", () => {
    const a = CANDIDATES[0].dist;
    expect(weightedAccuracy(a)).toBeCloseTo(0.84, 10);
    expect(driftScore(TRAIN_DIST, a)).toBeCloseTo(0.7398743691938192, 10);
    expect(isDrifting(TRAIN_DIST, a)).toBe(true);
  });

  it("candidate B: accuracy visibly moves too, so an accuracy monitor would already catch it", () => {
    const b = CANDIDATES[1].dist;
    expect(weightedAccuracy(b)).toBeCloseTo(0.87, 10);
    expect(driftScore(TRAIN_DIST, b)).toBeCloseTo(0.3965784284662088, 10);
    expect(isDrifting(TRAIN_DIST, b)).toBe(true);
  });

  it("candidate C: close to training on both accuracy and distribution — genuinely not drifting", () => {
    const c = CANDIDATES[2].dist;
    expect(weightedAccuracy(c)).toBeCloseTo(0.842, 10);
    expect(driftScore(TRAIN_DIST, c)).toBeCloseTo(0.0019461397767973516, 10);
    expect(isDrifting(TRAIN_DIST, c)).toBe(false);
  });
});
