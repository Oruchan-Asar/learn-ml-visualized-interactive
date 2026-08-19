import { describe, it, expect } from "vitest";
import { f, gradient, numericalGradient } from "@/lib/math-core/gradient";

describe("gradient of f(x) = x^2 - 4x + 5", () => {
  it("matches the hand-derived formula 2x - 4 at reference points", () => {
    expect(gradient(0)).toBeCloseTo(-4);
    expect(gradient(2)).toBeCloseTo(0); // the minimum: slope is flat
    expect(gradient(5)).toBeCloseTo(6);
  });

  it("agrees with central-difference numerical differentiation across the domain", () => {
    for (const x of [-3, -1, 0, 1.5, 2, 4, 7]) {
      expect(gradient(x)).toBeCloseTo(numericalGradient(x), 4);
    }
  });

  it("f itself has its minimum where the gradient is zero", () => {
    const xStar = 2;
    expect(gradient(xStar)).toBeCloseTo(0);
    // a small step in either direction should increase f
    expect(f(xStar + 0.1)).toBeGreaterThan(f(xStar));
    expect(f(xStar - 0.1)).toBeGreaterThan(f(xStar));
  });
});
