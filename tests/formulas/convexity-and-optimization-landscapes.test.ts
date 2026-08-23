import { describe, it, expect } from "vitest";
import {
  bowl,
  bowlGradient,
  bowlHessian,
  landscape,
  landscapeGradient,
  landscapeHessian,
  determinant,
  classifyCriticalPoint,
  LANDSCAPE_MINIMUM_X,
} from "@/lib/math-core/convexity-and-optimization-landscapes";

describe("the convex bowl f(x,y) = x^2 + y^2", () => {
  it("has gradient zero only at the origin, its single global minimum", () => {
    const g = bowlGradient(0, 0);
    expect(g.x).toBe(0);
    expect(g.y).toBe(0);
    expect(bowl(0, 0)).toBe(0);
  });

  it("has a constant positive-definite Hessian everywhere", () => {
    const h = bowlHessian();
    expect(h).toEqual({ fxx: 2, fxy: 0, fyy: 2 });
    expect(determinant(h)).toBe(4);
    expect(classifyCriticalPoint(h)).toBe("minimum");
  });
});

describe("the non-convex landscape f(x,y) = (x^2-2)^2 + y^2", () => {
  it("has three critical points: origin, and x = ±√2 (both y=0)", () => {
    const origin = landscapeGradient(0, 0);
    expect(origin.x).toBeCloseTo(0, 10);
    expect(origin.y).toBeCloseTo(0, 10);

    const rightWell = landscapeGradient(LANDSCAPE_MINIMUM_X, 0);
    expect(rightWell.x).toBeCloseTo(0, 10);
    expect(rightWell.y).toBeCloseTo(0, 10);

    const leftWell = landscapeGradient(-LANDSCAPE_MINIMUM_X, 0);
    expect(leftWell.x).toBeCloseTo(0, 10);
    expect(leftWell.y).toBeCloseTo(0, 10);
  });

  it("classifies the origin as a saddle point — indefinite Hessian", () => {
    const h = landscapeHessian(0);
    expect(h).toEqual({ fxx: -8, fxy: 0, fyy: 2 });
    expect(determinant(h)).toBe(-16);
    expect(classifyCriticalPoint(h)).toBe("saddle");
  });

  it("classifies both wells as minima — positive-definite Hessian, value 0 (the global minimum)", () => {
    const h = landscapeHessian(LANDSCAPE_MINIMUM_X);
    expect(h.fxx).toBeCloseTo(16, 10);
    expect(h.fyy).toBe(2);
    expect(determinant(h)).toBeCloseTo(32, 10);
    expect(classifyCriticalPoint(h)).toBe("minimum");
    expect(landscape(LANDSCAPE_MINIMUM_X, 0)).toBeCloseTo(0, 10);

    const hLeft = landscapeHessian(-LANDSCAPE_MINIMUM_X);
    expect(classifyCriticalPoint(hLeft)).toBe("minimum");
    expect(landscape(-LANDSCAPE_MINIMUM_X, 0)).toBeCloseTo(0, 10);
  });

  it("the ridge point has a higher value than either well — it is not a global minimum", () => {
    expect(landscape(0, 0)).toBe(4);
    expect(landscape(0, 0)).toBeGreaterThan(landscape(LANDSCAPE_MINIMUM_X, 0));
  });
});
