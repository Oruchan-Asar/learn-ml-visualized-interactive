import { describe, expect, it } from "vitest";
import {
  TOKENS,
  DEFAULT_QUERY,
  TARGET_WEIGHT,
  TARGET_TOKEN,
  attentionScores,
  attentionWeights,
  attentionContext,
} from "@/lib/math-core/attention";

describe("scaled dot-product attention", () => {
  it("at the default query (1,1), every token is equidistant in dot product — attention is exactly uniform", () => {
    const weights = attentionWeights(DEFAULT_QUERY);
    for (const w of weights) expect(w).toBeCloseTo(1 / 3, 10);
  });

  it("weights always sum to 1", () => {
    for (const q of [{ x: 2, y: 0 }, { x: 0, y: 2 }, { x: -1, y: 3 }, { x: 0, y: 0 }]) {
      const weights = attentionWeights(q);
      expect(weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    }
  });

  it("matches the hand-derived scores when the query aligns with 'the' = (2,0)", () => {
    const scores = attentionScores({ x: 2, y: 0 });
    expect(scores[0]).toBeCloseTo(2.828, 3); // 4/sqrt(2)
    expect(scores[1]).toBeCloseTo(0, 10);
    expect(scores[2]).toBeCloseTo(1.414, 3); // 2/sqrt(2)
  });

  it("a query aligned with a token gives that token the most weight", () => {
    const weights = attentionWeights({ x: 2, y: 0 });
    expect(weights[0]).toBeGreaterThan(weights[1]);
    expect(weights[0]).toBeGreaterThan(weights[2]);
    expect(weights[0]).toBeCloseTo(0.768, 3);
  });

  it("querying directly at 'cat' pushes its weight past the checkpoint target", () => {
    const catIndex = TOKENS.findIndex((t) => t.label === TARGET_TOKEN);
    const weights = attentionWeights({ x: 0, y: 2 });
    expect(weights[catIndex]).toBeGreaterThan(TARGET_WEIGHT);
  });

  it("the context vector at the uniform-attention query is the simple average of all three tokens", () => {
    const context = attentionContext(DEFAULT_QUERY);
    const avgX = TOKENS.reduce((s, t) => s + t.x, 0) / TOKENS.length;
    const avgY = TOKENS.reduce((s, t) => s + t.y, 0) / TOKENS.length;
    expect(context.x).toBeCloseTo(avgX, 10);
    expect(context.y).toBeCloseTo(avgY, 10);
  });
});
