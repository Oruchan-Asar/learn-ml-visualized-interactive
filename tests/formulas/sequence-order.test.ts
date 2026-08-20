import { describe, expect, it } from "vitest";
import { POOLED_A, POOLED_B, MIN_LOSS, f, gradient } from "@/lib/math-core/sequence-order";

describe("sum-pooling erases order", () => {
  it("the two differently-ordered sequences pool to the exact same vector", () => {
    expect(POOLED_A).toEqual([1, 1]);
    expect(POOLED_B).toEqual([1, 1]);
    expect(POOLED_A).toEqual(POOLED_B);
  });
});

describe("no choice of weights can beat pure guessing", () => {
  it("at the origin, loss equals exactly ln(2)", () => {
    expect(f({ x: 0, y: 0 })).toBeCloseTo(MIN_LOSS, 10);
  });

  it("loss is identical everywhere along the w1 + w2 = 0 valley", () => {
    expect(f({ x: 2, y: -2 })).toBeCloseTo(MIN_LOSS, 10);
    expect(f({ x: -1, y: 1 })).toBeCloseTo(MIN_LOSS, 10);
    expect(f({ x: 5, y: -5 })).toBeCloseTo(MIN_LOSS, 10);
  });

  it("loss is strictly worse off the valley", () => {
    expect(f({ x: 1, y: 1 })).toBeGreaterThan(MIN_LOSS);
    expect(f({ x: -2, y: -2 })).toBeGreaterThan(MIN_LOSS);
  });

  it("the gradient vanishes at the origin — it's a true (flat) minimum, not just a plateau", () => {
    const g = gradient({ x: 0, y: 0 });
    expect(g.x).toBeCloseTo(0, 10);
    expect(g.y).toBeCloseTo(0, 10);
  });
});

describe("gradient matches a numerical finite-difference check", () => {
  it("agrees with the numeric slope at an off-valley point", () => {
    const w = { x: 0.5, y: 0.3 };
    const eps = 1e-5;
    const base = f(w);
    const numericGx = (f({ x: w.x + eps, y: w.y }) - base) / eps;
    const numericGy = (f({ x: w.x, y: w.y + eps }) - base) / eps;
    const analytic = gradient(w);
    expect(analytic.x).toBeCloseTo(numericGx, 3);
    expect(analytic.y).toBeCloseTo(numericGy, 3);
  });
});
