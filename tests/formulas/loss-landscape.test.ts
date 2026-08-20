import { describe, it, expect } from "vitest";
import { bowl, bowlGradient, saddle, saddleGradient, probabilityAllUpward, TARGET_VALUE } from "@/lib/math-core/loss-landscape";

describe("both surfaces have a zero gradient at the origin", () => {
  it("bowl's gradient is (0,0) at the origin", () => {
    expect(bowlGradient(0, 0)).toEqual({ x: 0, y: 0 });
  });

  it("saddle's gradient is also (0,0) at the origin — a flat point that isn't a minimum", () => {
    const g = saddleGradient(0, 0);
    expect(g.x).toBeCloseTo(0, 10);
    expect(g.y).toBeCloseTo(0, 10);
  });
});

describe("the bowl increases in every direction away from the origin", () => {
  it("increases along both x and y", () => {
    expect(bowl(1, 0)).toBeGreaterThan(bowl(0, 0));
    expect(bowl(0, 1)).toBeGreaterThan(bowl(0, 0));
    expect(bowl(-1, 0)).toBeGreaterThan(bowl(0, 0));
  });
});

describe("the saddle increases along x but decreases along y — not a true minimum", () => {
  it("increases moving along x from the origin", () => {
    expect(saddle(1, 0)).toBeGreaterThan(saddle(0, 0));
  });

  it("decreases moving along y from the origin", () => {
    expect(saddle(0, 1)).toBeLessThan(saddle(0, 0));
  });

  it("reaches the target value -2 at (0, sqrt(2)) exactly", () => {
    expect(saddle(0, Math.sqrt(2))).toBeCloseTo(TARGET_VALUE, 10);
  });

  it("at (0, 1.5), comfortably clears the target of -2", () => {
    expect(saddle(0, 1.5)).toBeLessThan(TARGET_VALUE);
  });
});

describe("probabilityAllUpward shrinks exponentially with dimension", () => {
  it("is exactly 0.5 in 1D, 0.25 in 2D, and 1/1024 in 10D", () => {
    expect(probabilityAllUpward(1)).toBeCloseTo(0.5, 10);
    expect(probabilityAllUpward(2)).toBeCloseTo(0.25, 10);
    expect(probabilityAllUpward(10)).toBeCloseTo(1 / 1024, 10);
  });

  it("is already under 1% by 7 dimensions", () => {
    expect(probabilityAllUpward(7)).toBeLessThan(0.01);
  });
});
