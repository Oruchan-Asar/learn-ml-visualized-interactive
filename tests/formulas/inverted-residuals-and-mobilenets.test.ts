import { describe, it, expect } from "vitest";
import {
  standardConvParams,
  standardConvFlops,
  depthwiseSeparableParams,
  depthwiseSeparableFlops,
  paramReductionRatio,
  invertedResidualParams,
  denseMiddleBottleneckParams,
  bottleneckReductionRatio,
  CHANNEL_OPTIONS,
  KERNEL_SIZE,
  SPATIAL_SIZE,
} from "@/lib/math-core/inverted-residuals-and-mobilenets";

describe("inverted-residuals-and-mobilenets", () => {
  it("a standard 3x3 conv at 4 channels costs exactly 144 params and 2304 FLOPs", () => {
    expect(standardConvParams(4, 4)).toBe(144);
    expect(standardConvFlops(4, 4)).toBe(144 * SPATIAL_SIZE * SPATIAL_SIZE);
    expect(standardConvFlops(4, 4)).toBe(2304);
  });

  it("the depthwise-separable factorization at 4 channels costs exactly 52 params", () => {
    // depthwise: 3*3*4 = 36, pointwise: 4*4 = 16, total 52.
    expect(depthwiseSeparableParams(4, 4)).toBe(52);
    expect(depthwiseSeparableFlops(4, 4)).toBe(52 * 16);
  });

  it("the separable/standard param ratio matches the exact 1/channels + 1/k^2 identity", () => {
    for (const c of CHANNEL_OPTIONS) {
      const expected = 1 / c + 1 / (KERNEL_SIZE * KERNEL_SIZE);
      expect(paramReductionRatio(c)).toBeCloseTo(expected, 12);
    }
  });

  it("the efficiency gap widens as channel count grows — the ratio shrinks monotonically", () => {
    const ratios = CHANNEL_OPTIONS.map((c) => paramReductionRatio(c));
    for (let i = 1; i < ratios.length; i++) {
      expect(ratios[i]).toBeLessThan(ratios[i - 1]);
    }
    // it never drops below the 1/k^2 floor, no matter how wide the layer gets.
    expect(ratios[ratios.length - 1]).toBeGreaterThan(1 / (KERNEL_SIZE * KERNEL_SIZE));
  });

  it("the inverted-residual bottleneck at 4 channels costs exactly 408 params, far below a dense middle conv", () => {
    // expand 4->24: 96, depthwise 3x3@24: 216, project 24->4: 96, total 408.
    expect(invertedResidualParams(4)).toBe(408);
    // expand 96 + dense 3x3 24->24: 5184 + project 96 = 5376.
    expect(denseMiddleBottleneckParams(4)).toBe(5376);
    expect(bottleneckReductionRatio(4)).toBeCloseTo(408 / 5376, 12);
    expect(bottleneckReductionRatio(4)).toBeLessThan(0.1);
  });
});
