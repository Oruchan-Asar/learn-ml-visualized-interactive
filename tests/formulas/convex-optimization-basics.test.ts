import { describe, it, expect } from "vitest";
import { gradientDescentStep } from "@/lib/math-core/descent";
import {
  convexBowl,
  convexBowlGradient,
  convexBowlSecondDerivative,
  doubleWell,
  doubleWellGradient,
  doubleWellSecondDerivative,
  DOUBLE_WELL_MINIMA,
  DOUBLE_WELL_MIN_VALUE,
} from "@/lib/math-core/convex-optimization-basics";

function runDescent(x0: number, gradient: (x: number) => number, lr: number, steps: number): number {
  let x = x0;
  for (let i = 0; i < steps; i++) x = gradientDescentStep(x, gradient, lr);
  return x;
}

describe("the convex bowl", () => {
  it("has a second derivative that's positive everywhere — the convexity test passing at every point", () => {
    expect(convexBowlSecondDerivative()).toBeGreaterThan(0);
  });

  it("satisfies Jensen's inequality: the midpoint's value is below the average of the endpoints' values", () => {
    const midpoint = convexBowl(0); // (theta*(-1) + (1-theta)*1) at theta=0.5
    const average = 0.5 * convexBowl(-1) + 0.5 * convexBowl(1);
    expect(midpoint).toBe(0);
    expect(average).toBe(1);
    expect(midpoint).toBeLessThanOrEqual(average);
  });

  it("gradient descent reaches the same minimum (0) from any starting point", () => {
    expect(runDescent(-1.8, convexBowlGradient, 0.1, 60)).toBeCloseTo(0, 5);
    expect(runDescent(2.1, convexBowlGradient, 0.1, 60)).toBeCloseTo(0, 5);
  });
});

describe("the double well is not convex", () => {
  it("violates Jensen's inequality: the midpoint's value is ABOVE the average of the endpoints' values", () => {
    const [left, right] = DOUBLE_WELL_MINIMA;
    const midpoint = doubleWell(0); // theta=0.5 between the two minima
    const average = 0.5 * doubleWell(left) + 0.5 * doubleWell(right);
    expect(midpoint).toBe(0);
    expect(average).toBeCloseTo(DOUBLE_WELL_MIN_VALUE, 10);
    expect(midpoint).toBeGreaterThan(average);
  });

  it("has a negative second derivative at the local max (0) and positive at both minima", () => {
    expect(doubleWellSecondDerivative(0)).toBeLessThan(0);
    expect(doubleWellSecondDerivative(DOUBLE_WELL_MINIMA[0])).toBeGreaterThan(0);
    expect(doubleWellSecondDerivative(DOUBLE_WELL_MINIMA[1])).toBeGreaterThan(0);
  });

  it("both minima sit at the exact same height, -4, at x = +/- sqrt(2)", () => {
    expect(doubleWell(DOUBLE_WELL_MINIMA[0])).toBeCloseTo(-4, 10);
    expect(doubleWell(DOUBLE_WELL_MINIMA[1])).toBeCloseTo(-4, 10);
  });

  it("gradient descent's outcome depends on which side of 0 it starts on", () => {
    const fromLeft = runDescent(-0.3, doubleWellGradient, 0.05, 40);
    const fromRight = runDescent(0.3, doubleWellGradient, 0.05, 40);
    expect(fromLeft).toBeCloseTo(DOUBLE_WELL_MINIMA[0], 8);
    expect(fromRight).toBeCloseTo(DOUBLE_WELL_MINIMA[1], 8);
    expect(fromLeft).not.toBeCloseTo(fromRight, 1);
  });
});
