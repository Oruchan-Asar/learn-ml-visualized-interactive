import { describe, it, expect } from "vitest";
import {
  f,
  gradientF,
  HESSIAN,
  F,
  jacobian,
  determinant2,
  trace2,
  toGrid,
  isPositiveDefinite2,
} from "@/lib/math-core/jacobians-and-hessians";

describe("f(x,y) = x^2 + xy + y^2 and its Hessian", () => {
  it("matches the worked example gradient at (3,2): (8, 7)", () => {
    const g = gradientF(3, 2);
    expect(g.x).toBe(8);
    expect(g.y).toBe(7);
  });

  it("has a constant Hessian [[2,1],[1,2]], since f is quadratic", () => {
    expect(HESSIAN).toEqual({ a: 2, b: 1, c: 1, d: 2 });
    expect(determinant2(HESSIAN)).toBe(3);
    expect(trace2(HESSIAN)).toBe(4);
  });

  it("is positive definite — f is a genuine bowl with a single minimum at the origin", () => {
    expect(isPositiveDefinite2(HESSIAN)).toBe(true);
    expect(f(0, 0)).toBe(0);
    expect(f(1, 1)).toBeGreaterThan(0);
  });
});

describe("F(x,y) = (x^2+y, x+y^2) and its Jacobian", () => {
  it("matches the worked example at (2,3): F = (7, 11), J = [[4,1],[1,6]]", () => {
    const out = F(2, 3);
    expect(out.x).toBe(7);
    expect(out.y).toBe(11);
    const j = jacobian(2, 3);
    expect(j).toEqual({ a: 4, b: 1, c: 1, d: 6 });
    expect(determinant2(j)).toBe(23);
  });

  it("matches the checkpoint point (1,4): J = [[2,1],[1,8]], det = 15", () => {
    const j = jacobian(1, 4);
    expect(j).toEqual({ a: 2, b: 1, c: 1, d: 8 });
    expect(determinant2(j)).toBe(15);
    expect(trace2(j)).toBe(10);
    expect(j.b * j.c).toBe(1);
  });

  it("genuinely changes from point to point, unlike the constant Hessian above", () => {
    const j1 = jacobian(0, 0);
    const j2 = jacobian(5, -1);
    expect(j1).not.toEqual(j2);
  });

  it("renders as a row-major 2x2 grid for the heatmap", () => {
    expect(toGrid({ a: 1, b: 2, c: 3, d: 4 })).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });
});
