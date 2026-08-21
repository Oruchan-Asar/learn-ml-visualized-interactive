import { describe, it, expect } from "vitest";
import {
  fullFineTuneTrace,
  trainLora,
  loraLoss,
  LORA_START,
  TARGET_DELTA_W,
  outerProduct,
  FULL_FINE_TUNE_PARAM_COUNT,
  LORA_PARAM_COUNT,
} from "@/lib/math-core/lora-and-parameter-efficient-fine-tuning";

describe("lora-and-parameter-efficient-fine-tuning", () => {
  it("full fine-tuning reaches the exact target in a single step at its ideal rate", () => {
    const trace = fullFineTuneTrace(1, 0.5);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        expect(trace[1][i][j]).toBeCloseTo(TARGET_DELTA_W[i][j], 12);
      }
    }
  });

  it("LoRA uses exactly half the parameters of a full fine-tune on this 4x4 matrix", () => {
    expect(FULL_FINE_TUNE_PARAM_COUNT).toBe(16);
    expect(LORA_PARAM_COUNT).toBe(8);
  });

  it("LoRA's low-rank approximation converges to essentially the exact target after 100 steps", () => {
    const trace = trainLora(100, 0.02, LORA_START);
    const final = trace[trace.length - 1];
    expect(loraLoss(final)).toBeLessThan(1e-20);
    const approx = outerProduct(final.a, final.b);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        expect(approx[i][j]).toBeCloseTo(TARGET_DELTA_W[i][j], 6);
      }
    }
  });

  it("the learned vectors don't match the generating vectors exactly, due to scale invariance", () => {
    const trace = trainLora(100, 0.02, LORA_START);
    const final = trace[trace.length - 1];
    // a*scale, b/scale gives the same product, so the individual vectors need not match A_TRUE/B_TRUE.
    expect(final.a[0]).not.toBeCloseTo(1, 2);
    expect(loraLoss(final)).toBeLessThan(1e-20);
  });
});
