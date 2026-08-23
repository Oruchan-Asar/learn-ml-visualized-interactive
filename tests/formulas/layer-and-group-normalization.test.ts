import { describe, it, expect } from "vitest";
import {
  ACTIVATIONS,
  NUM_CHANNELS,
  mean,
  variance,
  groupNormalize,
  UNIFORM_PM_ONE_NUM_GROUPS,
  UNIFORM_PM_ONE_TOLERANCE,
  VALID_NUM_GROUPS,
} from "@/lib/math-core/layer-and-group-normalization";

describe("mean and variance match hand computation on the fixed activation vector", () => {
  it("mean of [2, -1, 0.5, 3, -2.5, 1] is 0.5", () => {
    expect(mean(ACTIVATIONS)).toBeCloseTo(0.5, 10);
  });

  it("variance matches the hand-computed value", () => {
    // deviations: 1.5, -1.5, 0, 2.5, -3, 0.5 -> squares: 2.25, 2.25, 0, 6.25, 9, 0.25 -> sum 20, /6
    expect(variance(ACTIVATIONS)).toBeCloseTo(20 / 6, 10);
  });
});

describe("numGroups = 1 (LayerNorm): normalizes across all 6 channels at once", () => {
  it("the normalized vector has mean ~0 and variance ~1", () => {
    const out = groupNormalize(ACTIVATIONS, 1);
    expect(mean(out)).toBeCloseTo(0, 3);
    expect(variance(out)).toBeCloseTo(1, 2);
  });
});

describe("numGroups = NUM_CHANNELS (instance norm degenerate limit): every value normalizes to 0", () => {
  it("each channel is normalized against only itself, so every output is exactly 0", () => {
    const out = groupNormalize(ACTIVATIONS, NUM_CHANNELS);
    for (const v of out) expect(v).toBeCloseTo(0, 6);
  });
});

describe("numGroups = 3 (2-element groups): every normalized value comes out exactly +-1", () => {
  it("all six outputs land within tolerance of +-1", () => {
    const out = groupNormalize(ACTIVATIONS, UNIFORM_PM_ONE_NUM_GROUPS);
    for (const v of out) {
      expect(Math.abs(Math.abs(v) - 1)).toBeLessThanOrEqual(UNIFORM_PM_ONE_TOLERANCE);
    }
  });

  it("hand computation for the first group [2, -1]: mean 0.5, std 1.5 -> normalized to 1 and -1", () => {
    const out = groupNormalize(ACTIVATIONS, 3);
    expect(out[0]).toBeCloseTo(1, 3);
    expect(out[1]).toBeCloseTo(-1, 3);
  });
});

describe("every value in VALID_NUM_GROUPS evenly divides the channel count", () => {
  it("no remainder for any listed group count", () => {
    for (const g of VALID_NUM_GROUPS) {
      expect(NUM_CHANNELS % g).toBe(0);
    }
  });
});
