import { describe, it, expect } from "vitest";
import { patchAttentionWeights, PATCHES, chebyshevDistance, inSingleConvReceptiveField } from "@/lib/math-core/vision-transformers";

describe("vision-transformers", () => {
  it("top-left and bottom-right are outside a single 3x3 conv's receptive field", () => {
    const tl = PATCHES[0];
    const br = PATCHES[8];
    expect(chebyshevDistance(tl, br)).toBe(2);
    expect(inSingleConvReceptiveField(tl, br)).toBe(false);
  });

  it("top-left IS within a single conv's receptive field of its immediate neighbors", () => {
    const tl = PATCHES[0];
    const topMiddle = PATCHES[1];
    expect(chebyshevDistance(tl, topMiddle)).toBe(1);
    expect(inSingleConvReceptiveField(tl, topMiddle)).toBe(true);
  });

  it("self-attention gives top-left substantial weight on bottom-right despite the distance", () => {
    const weights = patchAttentionWeights(0);
    expect(weights[8]).toBeCloseTo(0.2980950700140904, 12);
    expect(weights[8]).toBeGreaterThan(0.25);
  });

  it("attention groups patches by content (brightness), not by spatial adjacency", () => {
    const weights = patchAttentionWeights(0);
    const brightSum = weights[0] + weights[4] + weights[8];
    const darkSum = weights[1] + weights[2] + weights[3] + weights[5] + weights[6] + weights[7];
    expect(brightSum).toBeCloseTo(0.8942852100422712, 10);
    expect(darkSum).toBeCloseTo(0.10571478995772861, 10);
    expect(brightSum).toBeGreaterThan(darkSum * 8);
  });
});
