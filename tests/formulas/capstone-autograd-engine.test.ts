import { describe, it, expect } from "vitest";
import {
  forwardPass,
  backwardPass,
  f,
  analyticGradient,
  numericalGradient,
  OUTPUT_ID,
} from "@/lib/math-core/capstone-autograd-engine";

describe("forward pass on f(a,b) = a*b + a, at a=3, b=4", () => {
  it("computes n1 = 12, n2 = 15, matching the chapter's worked example", () => {
    const values = forwardPass({ a: 3, b: 4 });
    expect(values.n1).toBe(12);
    expect(values.n2).toBe(15);
    expect(values[OUTPUT_ID]).toBe(15);
    expect(f(3, 4)).toBe(15);
  });
});

describe("backward pass on f(a,b) = a*b + a, at a=3, b=4", () => {
  it("accumulates ∂f/∂a = 5 from two paths (1 direct + 4 through the product), and ∂f/∂b = 3", () => {
    const values = forwardPass({ a: 3, b: 4 });
    const grads = backwardPass(values);
    expect(grads.a).toBe(5);
    expect(grads.b).toBe(3);
    expect(grads.n1).toBe(1);
    expect(grads.n2).toBe(1);
  });

  it("matches the exact analytic gradient (∂f/∂a = b+1, ∂f/∂b = a)", () => {
    const analytic = analyticGradient(3, 4);
    expect(analytic.da).toBe(5);
    expect(analytic.db).toBe(3);
  });

  it("matches central-difference numerical gradients closely", () => {
    const values = forwardPass({ a: 3, b: 4 });
    const grads = backwardPass(values);
    const numeric = numericalGradient(3, 4);
    expect(grads.a).toBeCloseTo(numeric.da, 3);
    expect(grads.b).toBeCloseTo(numeric.db, 3);
  });
});

describe("the checkpoint case, a=5, b=-2", () => {
  it("forward pass gives n1=-10, n2=f=-5", () => {
    const values = forwardPass({ a: 5, b: -2 });
    expect(values.n1).toBe(-10);
    expect(values.n2).toBe(-5);
    expect(f(5, -2)).toBe(-5);
  });

  it("backward pass gives ∂f/∂a = -1 (both paths combined) and ∂f/∂b = 5", () => {
    const values = forwardPass({ a: 5, b: -2 });
    const grads = backwardPass(values);
    expect(grads.a).toBe(-1);
    expect(grads.b).toBe(5);
    // The two individual path contributions to `a`, named for the checkpoint's wrong-answer candidates.
    expect(grads.n2).toBe(1); // the direct add-path contribution to a
    expect(grads.n1 * values.b).toBe(-2); // the mul-path contribution to a
  });

  it("matches the analytic and numerical gradients", () => {
    const analytic = analyticGradient(5, -2);
    expect(analytic.da).toBe(-1);
    expect(analytic.db).toBe(5);
    const numeric = numericalGradient(5, -2);
    expect(numeric.da).toBeCloseTo(-1, 3);
    expect(numeric.db).toBeCloseTo(5, 3);
  });
});

describe("gradient always agrees with numerical differentiation across random-ish inputs", () => {
  it("holds for several (a,b) pairs", () => {
    for (const [a, b] of [
      [0, 0],
      [-3, 7],
      [2.5, -1.5],
      [10, 10],
    ]) {
      const values = forwardPass({ a, b });
      const grads = backwardPass(values);
      const numeric = numericalGradient(a, b);
      expect(grads.a).toBeCloseTo(numeric.da, 3);
      expect(grads.b).toBeCloseTo(numeric.db, 3);
    }
  });
});
