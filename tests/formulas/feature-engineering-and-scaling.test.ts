import { describe, it, expect } from "vitest";
import { gradient, train, X1, X2, X2_SCALED, Y, TRUE_W2_SCALED } from "@/lib/math-core/feature-engineering-and-scaling";

describe("feature-engineering-and-scaling", () => {
  it("the large-scale feature has a far steeper gradient at the same starting point", () => {
    const g0 = gradient({ w1: 0, w2: 0 }, X1, X2, Y);
    expect(g0.w1).toBe(-6);
    expect(g0.w2).toBe(-400);
  });

  it("a learning rate safe for the large-scale feature leaves the small-scale feature nearly frozen", () => {
    const trace = train(0.00005, 20, X1, X2, Y);
    const final = trace[trace.length - 1];
    expect(final.w2).toBeCloseTo(0.02, 10);
    expect(final.w1).toBeCloseTo(0.0059943034185469665, 10);
    expect(3 - final.w1).toBeGreaterThan(2.9);
  });

  it("a 2x larger learning rate puts the large-scale feature right at the oscillation boundary", () => {
    const trace = train(0.0001, 5, X1, X2, Y);
    expect(trace[1].w2).toBeCloseTo(0.04, 10);
    expect(trace[2].w2).toBeCloseTo(0, 10);
    expect(trace[3].w2).toBeCloseTo(0.04, 10);
  });

  it("after scaling both features to the same range, one shared learning rate converges both exactly", () => {
    expect(TRUE_W2_SCALED).toBe(2);
    const trace = train(0.5, 2, X1, X2_SCALED, Y);
    expect(trace[1].w1).toBe(3);
    expect(trace[1].w2).toBe(2);
    expect(trace[2]).toEqual(trace[1]);
  });
});
