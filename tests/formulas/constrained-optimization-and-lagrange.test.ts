import { describe, it, expect } from "vitest";
import {
  f,
  gradientF,
  g,
  GRADIENT_G,
  pointOnConstraint,
  alignmentError,
  impliedLambdaFromX,
  impliedLambdaFromY,
  CONSTRAINED_OPTIMUM,
  CONSTRAINED_OPTIMUM_VALUE,
  CONSTRAINED_OPTIMUM_LAMBDA,
} from "@/lib/math-core/constrained-optimization-and-lagrange";

describe("the constraint line x + y = 4", () => {
  it("g is zero for any point parametrized along the line", () => {
    for (const x of [-1, 0, 2, 4, 6]) {
      const p = pointOnConstraint(x);
      expect(g(p.x, p.y)).toBeCloseTo(0, 10);
    }
  });

  it("∇g is the constant vector (1,1)", () => {
    expect(GRADIENT_G).toEqual({ x: 1, y: 1 });
  });
});

describe("a non-optimal feasible point, x=0 (so the point is (0,4))", () => {
  it("has mismatched implied λ from each component — not the Lagrange condition", () => {
    const p = pointOnConstraint(0);
    expect(f(p.x, p.y)).toBe(16);
    expect(impliedLambdaFromX(p.x)).toBe(0);
    expect(impliedLambdaFromY(p.y)).toBe(8);
    expect(alignmentError(p.x, p.y)).toBe(-8);
  });
});

describe("the constrained optimum at (2,2)", () => {
  it("satisfies the constraint and matches the known optimum", () => {
    expect(g(CONSTRAINED_OPTIMUM.x, CONSTRAINED_OPTIMUM.y)).toBeCloseTo(0, 10);
    expect(f(CONSTRAINED_OPTIMUM.x, CONSTRAINED_OPTIMUM.y)).toBe(CONSTRAINED_OPTIMUM_VALUE);
  });

  it("has zero alignment error — ∇f is exactly parallel to ∇g", () => {
    expect(alignmentError(CONSTRAINED_OPTIMUM.x, CONSTRAINED_OPTIMUM.y)).toBe(0);
  });

  it("both components imply the same λ = 4, matching CONSTRAINED_OPTIMUM_LAMBDA", () => {
    expect(impliedLambdaFromX(CONSTRAINED_OPTIMUM.x)).toBe(CONSTRAINED_OPTIMUM_LAMBDA);
    expect(impliedLambdaFromY(CONSTRAINED_OPTIMUM.y)).toBe(CONSTRAINED_OPTIMUM_LAMBDA);
  });

  it("achieves a strictly smaller f than other feasible points", () => {
    const other = pointOnConstraint(0);
    expect(CONSTRAINED_OPTIMUM_VALUE).toBeLessThan(f(other.x, other.y));
    const another = pointOnConstraint(5);
    expect(CONSTRAINED_OPTIMUM_VALUE).toBeLessThan(f(another.x, another.y));
  });
});

describe("gradientF sanity", () => {
  it("matches (2x,2y) at an arbitrary point", () => {
    const grad = gradientF(3, -1);
    expect(grad.x).toBe(6);
    expect(grad.y).toBe(-2);
  });
});
