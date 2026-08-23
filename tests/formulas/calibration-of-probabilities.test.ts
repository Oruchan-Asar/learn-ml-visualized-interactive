import { describe, expect, it } from "vitest";
import { TRUE_PROBS, rawPrediction, calibrate, reliabilityBuckets, expectedCalibrationError } from "@/lib/math-core/calibration-of-probabilities";

describe("k=1 reproduces the true, already-calibrated probabilities exactly", () => {
  it("rawPrediction(p, 1) === p for every example", () => {
    TRUE_PROBS.forEach((p) => expect(rawPrediction(p, 1)).toBeCloseTo(p, 10));
  });

  it("the reliability diagram is perfectly calibrated: predicted average equals actual frequency in both buckets", () => {
    const buckets = reliabilityBuckets(1);
    expect(buckets.low.predictedAvg).toBeCloseTo(0.25, 10);
    expect(buckets.low.actualFreq).toBeCloseTo(0.25, 10);
    expect(buckets.high.predictedAvg).toBeCloseTo(0.75, 10);
    expect(buckets.high.actualFreq).toBeCloseTo(0.75, 10);
  });

  it("expected calibration error is exactly 0", () => {
    expect(expectedCalibrationError(1)).toBeCloseTo(0, 10);
  });
});

describe("k=1.2 exaggerates confidence, pulling predicted averages away from the true frequencies", () => {
  it("low bucket predicted average drops to 0.2 while the actual rate stays 0.25", () => {
    const buckets = reliabilityBuckets(1.2);
    expect(buckets.low.predictedAvg).toBeCloseTo(0.2, 10);
    expect(buckets.low.actualFreq).toBeCloseTo(0.25, 10);
  });

  it("high bucket predicted average rises to 0.8 while the actual rate stays 0.75", () => {
    const buckets = reliabilityBuckets(1.2);
    expect(buckets.high.predictedAvg).toBeCloseTo(0.8, 10);
    expect(buckets.high.actualFreq).toBeCloseTo(0.75, 10);
  });

  it("expected calibration error is exactly 0.05", () => {
    expect(expectedCalibrationError(1.2)).toBeCloseTo(0.05, 10);
  });
});

describe("calibrate() is the exact inverse of rawPrediction() for the same k — what Platt scaling recovers", () => {
  it("round-trips every true probability back exactly, for several k", () => {
    [1, 1.1, 1.2, 0.8].forEach((k) => {
      TRUE_PROBS.forEach((p) => {
        expect(calibrate(rawPrediction(p, k), k)).toBeCloseTo(p, 8);
      });
    });
  });
});

describe("clamping keeps every prediction inside [0,1] even for large k", () => {
  it("an extreme k still produces a valid probability", () => {
    const raw = rawPrediction(0.9, 5);
    expect(raw).toBeLessThanOrEqual(1);
    expect(raw).toBeGreaterThanOrEqual(0);
    expect(raw).toBe(1);
  });
});
