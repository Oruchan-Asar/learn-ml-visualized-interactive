import { describe, it, expect } from "vitest";
import { bidirectionalPrediction, causalPrediction, squaredError, maskedToken } from "@/lib/math-core/bert-and-masked-language-modeling";

describe("bert-and-masked-language-modeling", () => {
  it("the masked token is 'cat', in the middle of the sentence", () => {
    const truth = maskedToken();
    expect(truth.label).toBe("cat");
    expect(truth).toEqual({ label: "cat", x: 0, y: 2 });
  });

  it("the causal prediction can only see 'the' and reconstructs it exactly, missing 'cat' entirely", () => {
    const causal = causalPrediction();
    expect(causal).toEqual({ x: 2, y: 0 });
  });

  it("the bidirectional prediction blends 'the' and 'sat' equally, since both score identically against the mask query", () => {
    const bi = bidirectionalPrediction();
    expect(bi).toEqual({ x: 1.5, y: 0.5 });
  });

  it("bidirectional context cuts the reconstruction error nearly in half versus causal-only", () => {
    const truth = maskedToken();
    const biError = squaredError(bidirectionalPrediction(), truth);
    const causalError = squaredError(causalPrediction(), truth);
    expect(biError).toBe(4.5);
    expect(causalError).toBe(8);
    expect(biError).toBeLessThan(causalError);
  });
});
