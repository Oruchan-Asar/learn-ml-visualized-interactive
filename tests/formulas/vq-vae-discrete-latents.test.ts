import { describe, it, expect } from "vitest";
import { squaredDistance, nearestCodeIndex, quantize, quantizationError, CODEBOOK, ENCODER_OUTPUTS } from "@/lib/math-core/vq-vae-discrete-latents";

describe("squaredDistance", () => {
  it("computes plain squared Euclidean distance", () => {
    expect(squaredDistance({ x: 1, y: 1 }, { x: 0, y: 0 })).toBe(2);
  });
});

describe("nearestCodeIndex", () => {
  it("matches the hand-computed nearest code for every encoder output — all four distinct", () => {
    const indices = ENCODER_OUTPUTS.map((z) => nearestCodeIndex(z));
    expect(indices).toEqual([0, 1, 2, 3]);
    expect(new Set(indices).size).toBe(4);
  });
});

describe("quantize", () => {
  it("snaps each encoder output onto the exact codebook entry it's nearest to", () => {
    expect(quantize(ENCODER_OUTPUTS[0])).toEqual(CODEBOOK[0]);
    expect(quantize(ENCODER_OUTPUTS[1])).toEqual(CODEBOOK[1]);
    expect(quantize(ENCODER_OUTPUTS[2])).toEqual(CODEBOOK[2]);
    expect(quantize(ENCODER_OUTPUTS[3])).toEqual(CODEBOOK[3]);
  });

  it("a point already exactly on a code snaps to itself with zero error", () => {
    expect(quantize(CODEBOOK[1])).toEqual(CODEBOOK[1]);
    expect(quantizationError(CODEBOOK[1])).toBe(0);
  });
});

describe("quantizationError", () => {
  it("matches the hand-computed distances for every encoder output", () => {
    expect(quantizationError(ENCODER_OUTPUTS[0])).toBeCloseTo(Math.sqrt(2), 10);
    expect(quantizationError(ENCODER_OUTPUTS[1])).toBeCloseTo(Math.sqrt(0.5), 10);
    expect(quantizationError(ENCODER_OUTPUTS[2])).toBeCloseTo(Math.sqrt(0.29), 10);
    expect(quantizationError(ENCODER_OUTPUTS[3])).toBeCloseTo(Math.sqrt(1.13), 10);
  });

  it("encoder output 0 has the largest quantization error of the four", () => {
    const errors = ENCODER_OUTPUTS.map((z) => quantizationError(z));
    const maxIndex = errors.indexOf(Math.max(...errors));
    expect(maxIndex).toBe(0);
  });
});
