import { describe, it, expect } from "vitest";
import {
  ACTIVATIONS,
  mean,
  meanOfSquares,
  rms,
  rmsNormalize,
  layerNormalize,
  TARGET_CHANNEL_INDEX,
  TARGET_VALUE,
  TARGET_TOLERANCE,
  DEFAULT_GAIN,
} from "@/lib/math-core/rmsnorm";

describe("rms and mean match hand computation on the fixed activation vector", () => {
  it("mean of [2, -1, 0.5, 3, -2.5, 1] is 0.5, not 0", () => {
    expect(mean(ACTIVATIONS)).toBeCloseTo(0.5, 10);
  });

  it("mean of squares is 21.5 / 6", () => {
    // squares: 4, 1, 0.25, 9, 6.25, 1 -> sum 21.5
    expect(meanOfSquares(ACTIVATIONS)).toBeCloseTo(21.5 / 6, 10);
  });

  it("rms is sqrt(mean of squares), about 1.893", () => {
    expect(rms(ACTIVATIONS)).toBeCloseTo(Math.sqrt(21.5 / 6), 4);
  });
});

describe("RMSNorm never re-centers to mean 0, unlike LayerNorm on the same input", () => {
  it("RMSNorm's output mean is the input's mean divided by its RMS, not 0", () => {
    const out = rmsNormalize(ACTIVATIONS, DEFAULT_GAIN);
    const expectedMean = mean(ACTIVATIONS) / rms(ACTIVATIONS);
    expect(mean(out)).toBeCloseTo(expectedMean, 6);
    expect(mean(out)).not.toBeCloseTo(0, 2);
  });

  it("LayerNorm's output mean on the same vector is ~0", () => {
    const out = layerNormalize(ACTIVATIONS);
    expect(mean(out)).toBeCloseTo(0, 4);
  });
});

describe("gain scales the RMSNorm output linearly", () => {
  it("doubling the gain doubles every output value", () => {
    const g1 = rmsNormalize(ACTIVATIONS, 1);
    const g2 = rmsNormalize(ACTIVATIONS, 2);
    for (let i = 0; i < g1.length; i++) expect(g2[i]).toBeCloseTo(2 * g1[i], 6);
  });

  it("gain 0 zeroes out every channel", () => {
    const out = rmsNormalize(ACTIVATIONS, 0);
    for (const v of out) expect(v).toBeCloseTo(0, 10);
  });
});

describe("the checkpoint target is reachable within the documented tolerance", () => {
  it("some gain in [0, 3] brings the target channel within tolerance of TARGET_VALUE", () => {
    // solve gain * ACTIVATIONS[TARGET_CHANNEL_INDEX] / rms(ACTIVATIONS) = TARGET_VALUE
    const neededGain = (TARGET_VALUE * rms(ACTIVATIONS)) / ACTIVATIONS[TARGET_CHANNEL_INDEX];
    expect(neededGain).toBeGreaterThanOrEqual(0);
    expect(neededGain).toBeLessThanOrEqual(3);
    const out = rmsNormalize(ACTIVATIONS, neededGain);
    expect(Math.abs(out[TARGET_CHANNEL_INDEX] - TARGET_VALUE)).toBeLessThanOrEqual(TARGET_TOLERANCE);
  });
});
