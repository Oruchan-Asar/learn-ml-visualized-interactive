import { describe, expect, it } from "vitest";
import { blackBox, kernelWeight, generateSamples, weightedLinearFit, localFit, trueDerivative, SIGMA } from "@/lib/math-core/lime";

describe("the black box and its samples", () => {
  it("is x^2", () => {
    expect(blackBox(3)).toBe(9);
    expect(blackBox(5)).toBe(25);
  });

  it("generates 5 samples symmetric around x0, each with the black box's true value", () => {
    const samples = generateSamples(4);
    expect(samples.map((s) => s.x)).toEqual([2, 3, 4, 5, 6]);
    expect(samples.map((s) => s.y)).toEqual([4, 9, 16, 25, 36]);
  });

  it("kernel weight is 1 at distance 0 and symmetric in the sign of dx", () => {
    expect(kernelWeight(0)).toBe(1);
    expect(kernelWeight(-2, SIGMA)).toBeCloseTo(kernelWeight(2, SIGMA), 10);
  });
});

describe("the locally-fit slope exactly matches the true derivative, by symmetry", () => {
  it.each([1, 2, 3, 4, 5, 6, 7])("at x0 = %i, the weighted local slope equals 2*x0 exactly", (x0) => {
    const { slope } = localFit(x0);
    expect(slope).toBeCloseTo(trueDerivative(x0), 6);
  });

  it("this isn't a coincidence of one sigma — a much narrower or wider kernel still recovers the exact slope", () => {
    const samples = generateSamples(3);
    const narrow = weightedLinearFit(samples.map((s) => ({ ...s, weight: kernelWeight(s.x - 3, 0.5) })));
    const wide = weightedLinearFit(samples.map((s) => ({ ...s, weight: kernelWeight(s.x - 3, 5) })));
    expect(narrow.slope).toBeCloseTo(6, 6);
    expect(wide.slope).toBeCloseTo(6, 6);
  });

  it("the intercept is not the true function's value at x0 — the local line is a secant-like fit, not a tangent line pinned through the point", () => {
    const { intercept, slope } = localFit(3);
    const lineValueAtX0 = slope * 3 + intercept;
    expect(lineValueAtX0).not.toBeCloseTo(blackBox(3), 1);
  });
});
