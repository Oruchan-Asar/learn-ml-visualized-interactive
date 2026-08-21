import { describe, it, expect } from "vitest";
import { inContextAnswer, DOUBLE_DEMOS, NEGATE_DEMOS, QUERY_X } from "@/lib/math-core/prompting-and-in-context-learning";

describe("prompting-and-in-context-learning", () => {
  it("the attention weights depend only on the query's distance to the demo inputs, identical across prompts", () => {
    const double = inContextAnswer(DOUBLE_DEMOS, QUERY_X);
    const negate = inContextAnswer(NEGATE_DEMOS, QUERY_X);
    expect(double.weights).toEqual(negate.weights);
    expect(double.weights[1]).toBeCloseTo(double.weights[2], 12);
  });

  it("'double' demonstrations steer the query toward roughly double its value", () => {
    const result = inContextAnswer(DOUBLE_DEMOS, QUERY_X);
    expect(result.answer).toBeCloseTo(4.53391278950911, 10);
    expect(result.answer).toBeGreaterThan(4);
    expect(result.answer).toBeLessThan(5);
  });

  it("'negate' demonstrations, same query, same mechanism, steer toward roughly negating its value instead", () => {
    const result = inContextAnswer(NEGATE_DEMOS, QUERY_X);
    expect(result.answer).toBeCloseTo(-2.266956394754555, 10);
    expect(result.answer).toBeLessThan(-2);
    expect(result.answer).toBeGreaterThan(-2.5);
  });

  it("only the demonstrated outputs changed — the answer flips sign entirely from that alone", () => {
    const double = inContextAnswer(DOUBLE_DEMOS, QUERY_X).answer;
    const negate = inContextAnswer(NEGATE_DEMOS, QUERY_X).answer;
    expect(Math.sign(double)).not.toBe(Math.sign(negate));
  });
});
