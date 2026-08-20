import { describe, expect, it } from "vitest";
import { answerQuestion, rankAnswers } from "@/lib/math-core/vlm-assembled";

describe("the assembled pipeline: cross-attention feeding a nearest-answer lookup", () => {
  it("a query aligned with the sky patch answers 'sky'", () => {
    const result = answerQuestion({ x: 2, y: 0 });
    expect(result.answer.label).toBe("sky");
    expect(result.distanceToAnswer).toBeCloseTo(0.3924, 3);
  });

  it("a query aligned with the ground patch answers 'ground' — same mechanism, symmetric result", () => {
    const result = answerQuestion({ x: 0, y: 2 });
    expect(result.answer.label).toBe("ground");
    expect(result.distanceToAnswer).toBeCloseTo(0.3924, 3);
  });

  it("the context vector for a sky-aligned query sits far closer to 'sky' than to any other answer", () => {
    const ranking = rankAnswers({ x: 2, y: 0 });
    expect(ranking[0].label).toBe("sky");
    expect(ranking[1].d).toBeGreaterThan(ranking[0].d * 2.5);
  });

  it("'dog' ranks between 'sky' and 'ground' for a sky-aligned query, since it never gets the most attention", () => {
    const ranking = rankAnswers({ x: 2, y: 0 });
    expect(ranking.map((r) => r.label)).toEqual(["sky", "dog", "ground"]);
  });
});
