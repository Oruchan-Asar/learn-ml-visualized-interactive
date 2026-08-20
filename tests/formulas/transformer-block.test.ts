import { describe, expect, it } from "vitest";
import { TOKENS, DEFAULT_BIAS, attentionRow, attentionOutput, feedForward, transformerBlock } from "@/lib/math-core/transformer-block";

function closeVec(actual: number[], expected: number[], precision = 3) {
  expected.forEach((e, i) => expect(actual[i]).toBeCloseTo(e, precision));
}

describe("self-attention over two 3D tokens", () => {
  it("matches the hand-derived attention weights (symmetric by construction)", () => {
    const row0 = attentionRow(0);
    const row1 = attentionRow(1);
    closeVec(row0, [0.6405, 0.3595]);
    closeVec(row1, [0.3595, 0.6405]);
  });

  it("attention output blends both tokens, weighted toward the query's own token", () => {
    const out0 = attentionOutput(0);
    closeVec(out0, [0.6405, 0.3595, 1]);
  });
});

describe("feedforward sublayer with an adjustable bias", () => {
  it("at bias=0, token1's post-norm vector produces two dead ReLU units", () => {
    const block = transformerBlock(DEFAULT_BIAS);
    closeVec(block.ffn[0].hidden, [0, 0]);
  });

  it("token2's post-norm vector already has one active unit at bias=0", () => {
    const block = transformerBlock(DEFAULT_BIAS);
    expect(block.ffn[1].hidden[1]).toBeGreaterThan(0);
  });

  it("increasing the bias past ~0.436 activates token1's second hidden unit", () => {
    const below = feedForward(transformerBlock(0).norm1[0], 0.4);
    const above = feedForward(transformerBlock(0).norm1[0], 0.5);
    expect(Math.max(...below.hidden)).toBe(0);
    expect(Math.max(...above.hidden)).toBeGreaterThan(0);
  });
});

describe("residual connections carry the signal through even a dead sublayer", () => {
  it("when token1's FFN output is exactly zero, residual2 equals norm1 unchanged", () => {
    const block = transformerBlock(DEFAULT_BIAS);
    closeVec(block.ffn[0].output, [0, 0, 0]);
    closeVec(block.residual2[0], block.norm1[0]);
  });
});

describe("layer norm always produces a zero-mean, unit-variance vector", () => {
  it("norm1 and norm2 rows have (numerically) zero mean", () => {
    const block = transformerBlock(DEFAULT_BIAS);
    for (const v of [...block.norm1, ...block.norm2]) {
      const mean = v.reduce((a, b) => a + b, 0) / v.length;
      expect(mean).toBeCloseTo(0, 6);
    }
  });
});

describe("consistency: input token count matches output token count through every stage", () => {
  it("every stage has exactly as many rows as TOKENS", () => {
    const block = transformerBlock(DEFAULT_BIAS);
    for (const stage of [block.attentionOut, block.residual1, block.norm1, block.residual2, block.norm2]) {
      expect(stage).toHaveLength(TOKENS.length);
    }
  });
});
