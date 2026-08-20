import { describe, expect, it } from "vitest";
import { RELU_MAP, computeGradMap, channelWeight, computeGradCAM } from "@/lib/math-core/grad-cam";

describe("the gradient map is uniform, because every cell in each pooling quadrant is tied", () => {
  it("every cell's gradient w.r.t. 'Edge detected' is exactly 0.5", () => {
    const grad = computeGradMap(0);
    for (const row of grad) for (const v of row) expect(v).toBeCloseTo(0.5, 6);
  });

  it("every cell's gradient w.r.t. 'No edge' is exactly -0.5 — the same magnitude, opposite sign", () => {
    const grad = computeGradMap(1);
    for (const row of grad) for (const v of row) expect(v).toBeCloseTo(-0.5, 6);
  });
});

describe("the channel weight is the spatial average of the gradient map", () => {
  it("weight for 'Edge detected' is 0.5", () => {
    expect(channelWeight(0)).toBeCloseTo(0.5, 6);
  });

  it("weight for 'No edge' is -0.5", () => {
    expect(channelWeight(1)).toBeCloseTo(-0.5, 6);
  });
});

describe("Grad-CAM is class-discriminative", () => {
  it("'Edge detected''s CAM highlights the edge columns at 1.5, zero elsewhere", () => {
    const cam = computeGradCAM(0);
    for (const row of cam) {
      expect(row[0]).toBeCloseTo(0, 6);
      expect(row[1]).toBeCloseTo(0, 6);
      expect(row[2]).toBeCloseTo(1.5, 6);
      expect(row[3]).toBeCloseTo(1.5, 6);
    }
  });

  it("'No edge''s CAM is exactly zero everywhere — ReLU clips the negative weighted evidence", () => {
    const cam = computeGradCAM(1);
    for (const row of cam) for (const v of row) expect(v).toBeCloseTo(0, 6);
  });

  it("Grad-CAM's positive channel weight scales the raw activation map by exactly 0.5", () => {
    const cam = computeGradCAM(0);
    for (let r = 0; r < RELU_MAP.length; r++) {
      for (let c = 0; c < RELU_MAP[r].length; c++) {
        expect(cam[r][c]).toBeCloseTo(0.5 * RELU_MAP[r][c], 6);
      }
    }
  });
});
