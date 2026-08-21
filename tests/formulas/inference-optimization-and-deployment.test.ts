import { describe, it, expect } from "vitest";
import { workWithoutCache, workWithCache, speedupRatio, quantizationScale, quantizeAll, MEMORY_REDUCTION_FACTOR } from "@/lib/math-core/inference-optimization-and-deployment";

describe("inference-optimization-and-deployment", () => {
  it("without a cache, generating n tokens costs quadratic work; with a cache, linear", () => {
    expect(workWithoutCache(10)).toBe(55);
    expect(workWithCache(10)).toBe(10);
    expect(workWithoutCache(100)).toBe(5050);
    expect(workWithCache(100)).toBe(100);
  });

  it("the speedup from caching grows with sequence length, not just a fixed constant", () => {
    expect(speedupRatio(10)).toBe(5.5);
    expect(speedupRatio(100)).toBe(50.5);
    expect(speedupRatio(100)).toBeGreaterThan(speedupRatio(10) * 5);
  });

  it("int8 quantization shrinks memory 4x, since 32/8 = 4", () => {
    expect(MEMORY_REDUCTION_FACTOR).toBe(4);
  });

  it("the largest-magnitude weight quantizes with zero error, others with a small rounding error", () => {
    const results = quantizeAll();
    const largest = results.find((r) => r.original === 2.05)!;
    expect(largest.quantized).toBe(127);
    expect(largest.error).toBe(0);
    for (const r of results) {
      expect(r.error).toBeLessThan(0.01);
    }
  });

  it("the quantization scale is set so the largest weight maps exactly to the int8 range boundary", () => {
    const scale = quantizationScale();
    expect(scale).toBeCloseTo(2.05 / 127, 12);
  });
});
