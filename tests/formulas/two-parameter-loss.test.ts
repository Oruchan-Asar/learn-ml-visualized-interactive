import { describe, it, expect } from "vitest";
import { f, gradient } from "@/lib/math-core/two-parameter-loss";

describe("f(x,y) = (x-3)^2 + (y+2)^2", () => {
  it("is zero exactly at the minimum, (3,-2)", () => {
    expect(f(3, -2)).toBeCloseTo(0);
    const g = gradient(3, -2);
    expect(g.x).toBeCloseTo(0);
    expect(g.y).toBeCloseTo(0);
  });

  it("matches the worked example at (7,-6)", () => {
    const g = gradient(7, -6);
    expect(g.x).toBeCloseTo(8); // 2*(7-3)
    expect(g.y).toBeCloseTo(-8); // 2*(-6+2)
  });

  it("increases moving away from the minimum in any direction", () => {
    expect(f(4, -2)).toBeGreaterThan(f(3, -2));
    expect(f(3, -1)).toBeGreaterThan(f(3, -2));
    expect(f(0, 0)).toBeGreaterThan(f(3, -2));
  });
});
