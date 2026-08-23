import { describe, expect, it } from "vitest";
import {
  WEIGHTS,
  SCALE,
  quantizeLevel,
  dequantize,
  quantizeVector,
  meanSquaredError,
  fp32Bytes,
  int4Bytes,
  compressionRatio,
  CHECKPOINT_WEIGHT,
} from "@/lib/math-core/model-quantization-awq-gptq-gguf";

describe("model-quantization-awq-gptq-gguf", () => {
  it("the scale is the largest-magnitude weight divided by the top 4-bit level", () => {
    expect(SCALE).toBeCloseTo(0.4, 10);
  });

  it("most weights round to an exact multiple of the scale, with zero error", () => {
    expect(quantizeLevel(-1.6)).toBe(-4);
    expect(dequantize(quantizeLevel(-1.6))).toBeCloseTo(-1.6, 10);
    expect(quantizeLevel(-2.8)).toBe(-7);
    expect(quantizeLevel(2.0)).toBe(5);
  });

  it("two weights round to the wrong level and pick up exactly 0.1 of error", () => {
    const rows = quantizeVector();
    const withError = rows.filter((r) => Math.abs(r.error) > 1e-9);
    expect(withError).toHaveLength(2);
    withError.forEach((r) => expect(Math.abs(r.error)).toBeCloseTo(0.1, 10));
  });

  it("mean squared error across the whole vector is exact", () => {
    expect(meanSquaredError()).toBeCloseTo(0.0025, 10);
  });

  it("INT4 storage (plus one shared scale) is a 4x compression over FP32", () => {
    expect(fp32Bytes(WEIGHTS.length)).toBe(32);
    expect(int4Bytes(WEIGHTS.length)).toBe(8);
    expect(compressionRatio(WEIGHTS.length)).toBe(4);
  });

  it("an unseen weight quantizes to an exact, hand-checkable level", () => {
    expect(quantizeLevel(CHECKPOINT_WEIGHT)).toBe(3);
    expect(dequantize(quantizeLevel(CHECKPOINT_WEIGHT))).toBeCloseTo(1.2, 10);
  });
});
