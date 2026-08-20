import { describe, expect, it } from "vitest";
import { attentionScores, attentionWeights, attentionContext, DEFAULT_QUERY } from "@/lib/math-core/cross-attention";

describe("cross-attention: a text query over fixed image patches", () => {
  it("at the default query (1, 2), scores are (1.414, 2.828, 2.121)", () => {
    const scores = attentionScores(DEFAULT_QUERY);
    expect(scores[0]).toBeCloseTo(Math.sqrt(2), 6);
    expect(scores[1]).toBeCloseTo(2 * Math.sqrt(2), 6);
    expect(scores[2]).toBeCloseTo(1.5 * Math.sqrt(2), 6);
  });

  it("weights sum to 1 and favor the ground patch, since its score is highest", () => {
    const weights = attentionWeights(DEFAULT_QUERY);
    expect(weights.reduce((s, w) => s + w, 0)).toBeCloseTo(1, 10);
    expect(weights[1]).toBeGreaterThan(weights[0]);
    expect(weights[1]).toBeGreaterThan(weights[2]);
    expect(weights[1]).toBeCloseTo(0.576, 3);
  });

  it("the context vector is a weighted blend of all three patches, not any single one", () => {
    const context = attentionContext(DEFAULT_QUERY);
    expect(context.x).toBeCloseTo(0.564, 3);
    expect(context.y).toBeCloseTo(1.436, 3);
  });

  it("aligning the query exactly with the sky patch reproduces Part IV's original attention numbers", () => {
    const weights = attentionWeights({ x: 2, y: 0 });
    expect(weights[0]).toBeCloseTo(0.768, 3);
  });
});
