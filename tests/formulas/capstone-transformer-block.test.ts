import { describe, expect, it } from "vitest";
import {
  TOKENS,
  DEFAULT_BIAS,
  headAttentionWeights,
  headASlice,
  headBSlice,
  multiHeadAttentionOutput,
  feedForward,
  transformerBlock,
} from "@/lib/math-core/capstone-transformer-block";

function closeVec(actual: number[], expected: number[], precision = 3) {
  expect(actual).toHaveLength(expected.length);
  expected.forEach((e, i) => expect(actual[i]).toBeCloseTo(e, precision));
}

describe("multi-head self-attention over two 3D tokens", () => {
  it("Head A (dims 0-1) favors each token's own dimension", () => {
    closeVec(headAttentionWeights(0, headASlice), [0.6698, 0.3302]);
    closeVec(headAttentionWeights(1, headASlice), [0.3302, 0.6698]);
  });

  it("Head B (dim 2 only) is uniform, since both tokens share the same value there", () => {
    closeVec(headAttentionWeights(0, headBSlice), [0.5, 0.5]);
    closeVec(headAttentionWeights(1, headBSlice), [0.5, 0.5]);
  });

  it("concatenating both heads' outputs reproduces the full 3D attention output", () => {
    closeVec(multiHeadAttentionOutput(0), [0.6698, 0.3302, 1]);
    closeVec(multiHeadAttentionOutput(1), [0.3302, 0.6698, 1]);
  });
});

describe("residual + LayerNorm after attention", () => {
  it("norm1 rows are (numerically) zero-mean, regardless of the raw attention output", () => {
    const block = transformerBlock(DEFAULT_BIAS);
    for (const v of block.norm1) {
      const mean = v.reduce((a, b) => a + b, 0) / v.length;
      expect(mean).toBeCloseTo(0, 6);
    }
  });

  it("matches the hand-derived post-norm vectors", () => {
    const block = transformerBlock(DEFAULT_BIAS);
    closeVec(block.norm1[0], [0.466, -1.3893, 0.9234]);
    closeVec(block.norm1[1], [-1.3893, 0.466, 0.9234]);
  });
});

describe("feedforward sublayer with an adjustable bias", () => {
  it("at bias=0, x1's post-norm vector produces two dead ReLU units", () => {
    const block = transformerBlock(DEFAULT_BIAS);
    closeVec(block.ffn[0].hidden, [0, 0]);
  });

  it("x2's post-norm vector already has one active unit at bias=0", () => {
    const block = transformerBlock(DEFAULT_BIAS);
    expect(block.ffn[1].hidden[1]).toBeGreaterThan(0);
  });

  it("x1's second hidden unit stays dead just below the ~0.466 threshold and turns on just above it", () => {
    const below = feedForward(transformerBlock(0).norm1[0], 0.4);
    const above = feedForward(transformerBlock(0).norm1[0], 0.5);
    expect(Math.max(...below.hidden)).toBe(0);
    expect(Math.max(...above.hidden)).toBeGreaterThan(0);
  });
});

describe("residual connections carry the signal through even a dead sublayer", () => {
  it("when x1's FFN output is exactly zero, residual2 equals norm1 unchanged", () => {
    const block = transformerBlock(DEFAULT_BIAS);
    closeVec(block.ffn[0].output, [0, 0, 0]);
    closeVec(block.residual2[0], block.norm1[0]);
  });

  it("once the FFN contributes a real correction, residual2 differs from norm1", () => {
    const block = transformerBlock(0.6);
    expect(Math.abs(block.residual2[0][1] - block.norm1[0][1])).toBeGreaterThan(0.01);
  });
});

describe("consistency: every stage has as many rows as there are tokens", () => {
  it("attention, residual, norm, and ffn stages all match TOKENS.length", () => {
    const block = transformerBlock(DEFAULT_BIAS);
    for (const stage of [block.attentionOut, block.residual1, block.norm1, block.residual2, block.norm2]) {
      expect(stage).toHaveLength(TOKENS.length);
    }
    expect(block.ffn).toHaveLength(TOKENS.length);
  });
});
