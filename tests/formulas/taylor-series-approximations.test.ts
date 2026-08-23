import { describe, it, expect } from "vitest";
import {
  f,
  fPrime,
  fDoublePrime,
  linearApprox,
  quadraticApprox,
  approxError,
} from "@/lib/math-core/taylor-series-approximations";

describe("f(x) = x^3 and its derivatives at x0 = 1", () => {
  it("matches the worked example: f(1)=1, f'(1)=3, f''(1)=6", () => {
    expect(f(1)).toBe(1);
    expect(fPrime(1)).toBe(3);
    expect(fDoublePrime(1)).toBe(6);
  });
});

describe("Taylor approximations of f around x0=1, evaluated at x=1.5", () => {
  it("linear approximation matches the hand-derived value 2.5", () => {
    expect(linearApprox(1, 1.5)).toBeCloseTo(2.5, 10);
  });

  it("quadratic approximation matches the hand-derived value 3.25", () => {
    expect(quadraticApprox(1, 1.5)).toBeCloseTo(3.25, 10);
  });

  it("the true value is 3.375, and the quadratic approximation is closer than the linear one", () => {
    expect(f(1.5)).toBeCloseTo(3.375, 10);
    const linearError = approxError(linearApprox(1, 1.5), 1.5);
    const quadraticError = approxError(quadraticApprox(1, 1.5), 1.5);
    expect(linearError).toBeCloseTo(0.875, 10);
    expect(quadraticError).toBeCloseTo(0.125, 10);
    expect(quadraticError).toBeLessThan(linearError);
  });
});

describe("both approximations are exact at the expansion point itself", () => {
  it("linear and quadratic approximations equal f(x0) when x = x0", () => {
    expect(linearApprox(1, 1)).toBe(f(1));
    expect(quadraticApprox(1, 1)).toBe(f(1));
  });
});

describe("approximation error grows with distance from the expansion point", () => {
  it("linear approximation error at x=2 (far) exceeds error at x=1.2 (near)", () => {
    const near = approxError(linearApprox(1, 1.2), 1.2);
    const far = approxError(linearApprox(1, 2), 2);
    expect(far).toBeGreaterThan(near);
  });
});
