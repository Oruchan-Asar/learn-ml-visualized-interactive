import { describe, expect, it } from "vitest";
import {
  W,
  NORM,
  decisionValue,
  gradient,
  isApproved,
  distanceToBoundary,
  nearestCounterfactual,
  START_POINT,
} from "@/lib/math-core/counterfactual-explanations";

describe("the linear decision function", () => {
  it("||w|| is exactly 5, a clean 3-4-5 triangle", () => {
    expect(NORM).toBe(5);
  });

  it("the origin is denied, with decision value -20", () => {
    expect(decisionValue(START_POINT.x, START_POINT.y)).toBe(-20);
    expect(isApproved(START_POINT.x, START_POINT.y)).toBe(false);
  });

  it("the gradient is the constant weight vector everywhere", () => {
    expect(gradient(0, 0)).toEqual(W);
    expect(gradient(5, 5)).toEqual(W);
  });
});

describe("distance and the nearest counterfactual", () => {
  it("the origin is exactly 4 units from the boundary", () => {
    expect(distanceToBoundary(0, 0)).toBe(4);
  });

  it("the nearest counterfactual from the origin is exactly (2.4, 3.2)", () => {
    const cf = nearestCounterfactual(0, 0);
    expect(cf.x).toBeCloseTo(2.4, 10);
    expect(cf.y).toBeCloseTo(3.2, 10);
  });

  it("the counterfactual point sits exactly on the boundary (decision value 0)", () => {
    const cf = nearestCounterfactual(0, 0);
    expect(decisionValue(cf.x, cf.y)).toBeCloseTo(0, 10);
  });

  it("a point already past the boundary is approved, and has zero distance defined the same way", () => {
    expect(isApproved(3, 4)).toBe(true); // 3*3+4*4-20 = 9+16-20 = 5 >= 0
    expect(distanceToBoundary(3, 4)).toBeCloseTo(1, 10); // |5|/5 = 1
  });
});
