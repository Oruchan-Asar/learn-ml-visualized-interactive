import { describe, it, expect } from "vitest";
import { f, gradient, numericalGradient } from "@/lib/math-core/multivariable";

describe("gradient of f(x,y) = x^2 + y^2", () => {
  it("matches the worked example: at (3,4), ∇f = (6,8), magnitude 10", () => {
    const g = gradient(3, 4);
    expect(g.x).toBeCloseTo(6);
    expect(g.y).toBeCloseTo(8);
    expect(Math.hypot(g.x, g.y)).toBeCloseTo(10);
  });

  it("is the zero vector exactly at the minimum, (0,0)", () => {
    const g = gradient(0, 0);
    expect(g.x).toBeCloseTo(0);
    expect(g.y).toBeCloseTo(0);
    expect(f(0, 0)).toBeCloseTo(0);
  });

  it("agrees with central-difference numerical differentiation across the domain", () => {
    for (const [x, y] of [
      [-4, 2],
      [1.5, -3],
      [0, 5],
      [-2, -2],
      [5, 0.5],
    ]) {
      const analytic = gradient(x, y);
      const numeric = numericalGradient(x, y);
      expect(analytic.x).toBeCloseTo(numeric.x, 3);
      expect(analytic.y).toBeCloseTo(numeric.y, 3);
    }
  });

  it("grows in magnitude farther from the minimum", () => {
    const near = gradient(1, 1);
    const far = gradient(5, 5);
    expect(Math.hypot(far.x, far.y)).toBeGreaterThan(Math.hypot(near.x, near.y));
  });
});
