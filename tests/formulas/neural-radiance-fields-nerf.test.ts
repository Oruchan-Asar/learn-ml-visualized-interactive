import { describe, it, expect } from "vitest";
import {
  alphaFromDensity,
  transmittances,
  sampleWeights,
  compositeColor,
  totalOpacity,
  DEFAULT_SAMPLES,
  CHECKPOINT_TARGET_WEIGHT,
} from "@/lib/math-core/neural-radiance-fields-nerf";

describe("alphaFromDensity", () => {
  it("is 0 for zero density (nothing there to block light)", () => {
    expect(alphaFromDensity(0, 1)).toBe(0);
  });

  it("approaches 1 for very dense or very long steps", () => {
    expect(alphaFromDensity(50, 1)).toBeGreaterThan(0.999);
  });

  it("matches 1 - e^-1 for sigma=delta=1", () => {
    expect(alphaFromDensity(1, 1)).toBeCloseTo(1 - Math.exp(-1), 10);
    expect(alphaFromDensity(1, 1)).toBeCloseTo(0.6321, 3);
  });
});

describe("transmittances — hand-worked 3-sample ray [0.5, 0.5, 1.0]", () => {
  it("starts at full transmittance and halves after each 50%-opaque sample", () => {
    const alphas = DEFAULT_SAMPLES.map((s) => s.alpha);
    expect(transmittances(alphas)).toEqual([1, 0.5, 0.25]);
  });
});

describe("sampleWeights — hand-worked", () => {
  it("gives weights [0.5, 0.25, 0.25] for the default 3-sample ray", () => {
    const alphas = DEFAULT_SAMPLES.map((s) => s.alpha);
    expect(sampleWeights(alphas)).toEqual([0.5, 0.25, 0.25]);
  });

  it("weights sum to exactly 1 when the last sample is fully opaque", () => {
    const alphas = DEFAULT_SAMPLES.map((s) => s.alpha);
    const sum = sampleWeights(alphas).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
  });
});

describe("compositeColor — hand-worked", () => {
  it("blends red, green, and blue samples into (0.5, 0.25, 0.25)", () => {
    expect(compositeColor(DEFAULT_SAMPLES)).toEqual([0.5, 0.25, 0.25]);
  });
});

describe("totalOpacity", () => {
  it("is exactly 1 when the ray terminates on a fully opaque sample", () => {
    const alphas = DEFAULT_SAMPLES.map((s) => s.alpha);
    expect(totalOpacity(alphas)).toBeCloseTo(1, 10);
  });

  it("is less than 1 when nothing along the ray is fully opaque (background shows through)", () => {
    expect(totalOpacity([0.5, 0.5, 0.5])).toBeLessThan(1);
  });
});

describe("checkpoint target is reachable by adjusting sample 1's alpha", () => {
  it("alpha_1 = 0.2 (with samples 2-3 fixed) drives sample 3's weight to the checkpoint target", () => {
    const alphas = [0.2, DEFAULT_SAMPLES[1].alpha, DEFAULT_SAMPLES[2].alpha];
    const weights = sampleWeights(alphas);
    expect(weights[2]).toBeCloseTo(CHECKPOINT_TARGET_WEIGHT, 10);
  });
});
