import { describe, it, expect } from "vitest";
import { rmsPerLayer, IDEAL_SCALE, NUM_LAYERS, HEALTHY_RANGE, FAN_IN } from "@/lib/math-core/weight-init";

describe("IDEAL_SCALE is exactly 1/sqrt(fan_in)", () => {
  it("equals 1/sqrt(8) ≈ 0.3536", () => {
    expect(IDEAL_SCALE).toBeCloseTo(1 / Math.sqrt(8), 10);
    expect(IDEAL_SCALE).toBeCloseTo(0.3536, 3);
    expect(FAN_IN).toBe(8);
  });
});

describe("a too-small scale makes the signal vanish across layers", () => {
  it("at scale=0.05, RMS shrinks monotonically toward ~0 by the final layer", () => {
    const values = rmsPerLayer(0.05);
    expect(values).toHaveLength(NUM_LAYERS + 1);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeLessThan(values[i - 1]);
    }
    expect(values[NUM_LAYERS]).toBeLessThan(0.001);
  });
});

describe("a too-large scale makes the signal explode across layers", () => {
  it("at scale=1.0, RMS grows monotonically to over 100 by the final layer", () => {
    const values = rmsPerLayer(1.0);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
    expect(values[NUM_LAYERS]).toBeGreaterThan(100);
  });
});

describe("the ideal scale keeps every layer's RMS within a healthy, stable range", () => {
  it("at IDEAL_SCALE, every layer (not just the last) stays within roughly 0.5x-2x of the input", () => {
    const values = rmsPerLayer(IDEAL_SCALE);
    const inputRms = values[0];
    for (const v of values) {
      expect(v).toBeGreaterThan(inputRms * 0.4);
      expect(v).toBeLessThan(inputRms * 2);
    }
  });

  it("the final layer lands inside the healthy range", () => {
    const finalRms = rmsPerLayer(IDEAL_SCALE)[NUM_LAYERS];
    expect(finalRms).toBeGreaterThan(HEALTHY_RANGE[0]);
    expect(finalRms).toBeLessThan(HEALTHY_RANGE[1]);
  });
});

describe("the healthy scale range is a genuine band, not a single point", () => {
  it("scales from about 0.32 to 0.44 all land the final layer in the healthy range", () => {
    for (const scale of [0.32, 0.36, 0.4, 0.44]) {
      const finalRms = rmsPerLayer(scale)[NUM_LAYERS];
      expect(finalRms).toBeGreaterThan(HEALTHY_RANGE[0]);
      expect(finalRms).toBeLessThan(HEALTHY_RANGE[1]);
    }
  });

  it("0.05 and 1.0 both fall outside the healthy range, confirming it's a real constraint", () => {
    expect(rmsPerLayer(0.05)[NUM_LAYERS]).toBeLessThan(HEALTHY_RANGE[0]);
    expect(rmsPerLayer(1.0)[NUM_LAYERS]).toBeGreaterThan(HEALTHY_RANGE[1]);
  });
});
