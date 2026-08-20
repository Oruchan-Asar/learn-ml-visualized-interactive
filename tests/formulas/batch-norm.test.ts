import { describe, it, expect } from "vitest";
import { rmsPerLayer, IDEAL_SCALE, NUM_LAYERS, BAD_LOW, BAD_HIGH, GOOD_LOW, GOOD_HIGH } from "@/lib/math-core/batch-norm";

describe("without batch norm, only the ideal scale keeps activations stable", () => {
  it("scale=0.05 vanishes by the final layer", () => {
    expect(rmsPerLayer(0.05, false)[NUM_LAYERS]).toBeLessThan(BAD_LOW);
  });

  it("scale=1.0 explodes by the final layer", () => {
    expect(rmsPerLayer(1.0, false)[NUM_LAYERS]).toBeGreaterThan(BAD_HIGH);
  });

  it("the ideal scale stays roughly stable (within 0.5x-1.5x of the input) without batch norm", () => {
    const values = rmsPerLayer(IDEAL_SCALE, false);
    const inputRms = values[0];
    expect(values[NUM_LAYERS]).toBeGreaterThan(inputRms * 0.5);
    expect(values[NUM_LAYERS]).toBeLessThan(inputRms * 1.5);
  });
});

describe("with batch norm inserted after every layer, the scale stops mattering", () => {
  it("scale=0.05 (would vanish) now lands in the good range at every layer past the first", () => {
    const values = rmsPerLayer(0.05, true);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(GOOD_LOW);
      expect(values[i]).toBeLessThan(GOOD_HIGH);
    }
  });

  it("scale=1.0 (would explode) also lands in the good range at every layer past the first", () => {
    const values = rmsPerLayer(1.0, true);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(GOOD_LOW);
      expect(values[i]).toBeLessThan(GOOD_HIGH);
    }
  });

  it("every batch-normalized layer's RMS is extremely close to exactly 1", () => {
    for (const scale of [0.05, IDEAL_SCALE, 1.0]) {
      const values = rmsPerLayer(scale, true);
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeCloseTo(1, 1);
      }
    }
  });
});

describe("batch norm's effect is independent of the weight scale — the whole point", () => {
  it("the final-layer RMS with batch norm barely changes across wildly different scales", () => {
    const finalRmsAtVariousScales = [0.05, 0.2, IDEAL_SCALE, 0.6, 1.0].map((s) => rmsPerLayer(s, true)[NUM_LAYERS]);
    const spread = Math.max(...finalRmsAtVariousScales) - Math.min(...finalRmsAtVariousScales);
    expect(spread).toBeLessThan(0.05);
  });
});
