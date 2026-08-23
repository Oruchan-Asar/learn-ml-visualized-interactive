import { describe, it, expect } from "vitest";
import { runInduction, EXAMPLES, embed } from "@/lib/math-core/circuit-tracing-and-induction-heads";

describe("embed", () => {
  it("one-hot encodes each vocab token", () => {
    expect(embed("A")).toEqual([1, 0, 0]);
    expect(embed("B")).toEqual([0, 1, 0]);
    expect(embed("C")).toEqual([0, 0, 1]);
  });
});

describe("runInduction", () => {
  it("locks onto the earlier matching position and predicts what followed it", () => {
    const result = runInduction(["A", "B", "C", "A", "B"]);
    expect(result.weights).toEqual([0, 1, 0, 0]);
    expect(result.predicted).toBe("C");
    expect(result.maxWeight).toBe(1);
  });

  it("falls back to a uniform split when nothing in the sequence repeats", () => {
    const result = runInduction(["A", "B", "C"]);
    expect(result.weights).toEqual([0.5, 0.5]);
    expect(result.maxWeight).toBe(0.5);
  });

  it("matches hand-computed max weights across all four example sequences", () => {
    const maxWeights = EXAMPLES.map((ex) => runInduction(ex.sequence).maxWeight);
    expect(maxWeights).toEqual([1, 1, 0.5, 1]);
  });

  it("predicts B for the C A B C A sequence", () => {
    const result = runInduction(["C", "A", "B", "C", "A"]);
    expect(result.predicted).toBe("B");
  });
});
