import { describe, it, expect } from "vitest";
import { route } from "@/lib/math-core/mixture-of-experts";

describe("mixture-of-experts", () => {
  it("x=2 routes to experts 2 and 0, leaving experts 1 and 3 unevaluated", () => {
    const result = route(2);
    expect(result.selectedIndices).toEqual([2, 0]);
    expect(result.expertOutputs[1]).toBeNull();
    expect(result.expertOutputs[3]).toBeNull();
    expect(result.expertOutputs[2]).toBe(1);
    expect(result.expertOutputs[0]).toBe(2);
  });

  it("x=2's combined output blends the two selected experts by renormalized weight", () => {
    const result = route(2);
    expect(result.renormalizedWeights[0]).toBeCloseTo(0.7310585786300049, 12);
    expect(result.renormalizedWeights[1]).toBeCloseTo(0.26894142136999516, 12);
    expect(result.output).toBeCloseTo(1.2689414213699952, 12);
  });

  it("x=-2 routes to a completely different pair of experts: 3 and 1", () => {
    const result = route(-2);
    expect(result.selectedIndices).toEqual([3, 1]);
    expect(result.expertOutputs[0]).toBeNull();
    expect(result.expertOutputs[2]).toBeNull();
    expect(result.output).toBeCloseTo(1.882589949589966, 12);
  });

  it("the renormalized top-2 weights always sum to exactly 1, regardless of which experts were picked", () => {
    const sumFor2 = route(2).renormalizedWeights.reduce((a, b) => a + b, 0);
    const sumForNeg2 = route(-2).renormalizedWeights.reduce((a, b) => a + b, 0);
    expect(sumFor2).toBeCloseTo(1, 12);
    expect(sumForNeg2).toBeCloseTo(1, 12);
  });
});
