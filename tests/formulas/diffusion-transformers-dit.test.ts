import { describe, expect, it } from "vitest";
import {
  PATCHES,
  GRID_SIZE,
  NUM_PATCHES,
  T,
  positionIndex,
  timestepCondition,
  adaLN,
  patchEmbedding,
  ditAttentionWeights,
  ditAttentionMatrix,
  attentionOutput,
  selfAttentionWeight,
  TARGET_SELF_WEIGHT,
} from "@/lib/math-core/diffusion-transformers-dit";

describe("patchify: a 2x2 image grid flattened into a length-4 token sequence", () => {
  it("has exactly GRID_SIZE^2 patches", () => {
    expect(NUM_PATCHES).toBe(GRID_SIZE * GRID_SIZE);
    expect(PATCHES.length).toBe(NUM_PATCHES);
  });

  it("position index runs row-major, 0..3", () => {
    expect(PATCHES.map(positionIndex)).toEqual([0, 1, 2, 3]);
  });
});

describe("adaLN timestep conditioning", () => {
  it("t=0 is the identity -- an unconditioned patch, same as a plain ViT block", () => {
    expect(timestepCondition(0)).toBe(0);
    expect(adaLN(3, 0)).toBe(3);
    expect(adaLN(0, 0)).toBe(0);
  });

  it("t=T applies the full scale and shift", () => {
    expect(timestepCondition(T)).toBe(1);
    // gamma = 1 + 0.5*1 = 1.5, beta = -1*1 = -1
    expect(adaLN(3, T)).toBeCloseTo(1.5 * 3 - 1, 10);
  });

  it("matches the chapter's worked example at t=2 (c=0.5)", () => {
    expect(adaLN(3, 2)).toBeCloseTo(3.25, 10);
    expect(adaLN(1, 2)).toBeCloseTo(0.75, 10);
    expect(adaLN(0, 2)).toBeCloseTo(-0.5, 10);
    expect(adaLN(2, 2)).toBeCloseTo(2, 10);
  });

  it("patchEmbedding at t=0 is just content plus the plain position term", () => {
    const e = patchEmbedding(PATCHES[1], 0);
    expect(e.x).toBe(PATCHES[1].content);
    expect(e.y).toBeCloseTo(0.1, 10);
  });
});

describe("self-attention over patches, at a fixed timestep", () => {
  it("matches the chapter's hand-derived weights at t=2", () => {
    const weights = ditAttentionWeights(0, 2);
    expect(weights[0]).toBeCloseTo(0.9434591523100713, 10);
    expect(weights[1]).toBeCloseTo(0.003017143349416751, 10);
    expect(weights[2]).toBeCloseTo(0.0001706209540880276, 10);
    expect(weights[3]).toBeCloseTo(0.053353083386423854, 10);
  });

  it("weights from any query patch always sum to 1", () => {
    for (let q = 0; q < NUM_PATCHES; q++) {
      const sum = ditAttentionWeights(q, 2).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 10);
    }
  });

  it("the full attention matrix is NUM_PATCHES x NUM_PATCHES, each row a valid distribution", () => {
    const matrix = ditAttentionMatrix(2);
    expect(matrix.length).toBe(NUM_PATCHES);
    matrix.forEach((row) => {
      expect(row.length).toBe(NUM_PATCHES);
      expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    });
  });

  it("matches the chapter's worked attention output for p0 at t=2", () => {
    expect(attentionOutput(0, 2)).toBeCloseTo(3.175125958815598, 8);
  });
});

describe("the same conditioning is applied uniformly, so content ranking survives every timestep", () => {
  it("p0's attention always favors p3 over p1, regardless of t (content beats proximity, at any noise level)", () => {
    for (let t = 0; t <= T; t++) {
      const weights = ditAttentionWeights(0, t);
      expect(weights[3]).toBeGreaterThan(weights[1]);
    }
  });
});

describe("timestep conditioning sharpens p0's self-attention as t rises", () => {
  it("selfAttentionWeight increases monotonically with t", () => {
    const values = [0, 1, 2, 3, 4].map(selfAttentionWeight);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });

  it("crosses the checkpoint's target threshold somewhere between t=2 and t=3, not before", () => {
    expect(selfAttentionWeight(2)).toBeLessThan(TARGET_SELF_WEIGHT);
    expect(selfAttentionWeight(3)).toBeGreaterThan(TARGET_SELF_WEIGHT);
  });

  it("is deterministic -- repeated calls at the same t give the identical value", () => {
    expect(selfAttentionWeight(2.3)).toBe(selfAttentionWeight(2.3));
  });
});
