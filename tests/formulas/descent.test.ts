import { describe, it, expect } from "vitest";
import { gradient } from "@/lib/math-core/gradient";
import { gradientDescentStep } from "@/lib/math-core/descent";

/**
 * For f(x) = x^2 - 4x + 5, one step is x_new = x(1 - 2*lr) + 4*lr — a linear
 * recurrence around the minimum x* = 2. It converges iff |1 - 2*lr| < 1,
 * i.e. 0 < lr < 1, and diverges outside that range. These tests check both
 * regimes so a chapter that shows "too-high learning rate blows up" is
 * demonstrating a real, verified fact rather than a canned animation.
 */
describe("gradientDescentStep on f(x) = x^2 - 4x + 5", () => {
  it("converges toward the minimum (x* = 2) for a stable learning rate", () => {
    let x = 8;
    for (let i = 0; i < 100; i++) {
      x = gradientDescentStep(x, gradient, 0.1);
    }
    expect(x).toBeCloseTo(2, 6);
  });

  it("diverges for a learning rate above the stability threshold", () => {
    let x = 8;
    for (let i = 0; i < 30; i++) {
      x = gradientDescentStep(x, gradient, 1.2);
    }
    expect(Math.abs(x - 2)).toBeGreaterThan(1e5);
  });

  it("takes exactly the hand-computable first two steps from the worked example", () => {
    const x1 = gradientDescentStep(5, gradient, 0.1);
    expect(x1).toBeCloseTo(4.4, 10);
    const x2 = gradientDescentStep(x1, gradient, 0.1);
    expect(x2).toBeCloseTo(3.92, 10);
  });
});
