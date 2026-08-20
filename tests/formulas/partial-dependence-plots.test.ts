import { describe, it, expect } from "vitest";
import { allIceCurves, pdpCurve, iceSpreadAt, X1_GRID } from "@/lib/math-core/partial-dependence-plots";

describe("partial-dependence-plots", () => {
  it("each row's ICE curve has a real, distinct slope driven by its own x2", () => {
    const ice = allIceCurves();
    expect(ice[0]).toEqual([-4, -2, 0, 2, 4]);
    expect(ice[1]).toEqual([-2, -1, 0, 1, 2]);
    expect(ice[2]).toEqual([2, 1, -0, -1, -2]);
    expect(ice[3]).toEqual([4, 2, -0, -2, -4]);
  });

  it("the PDP is exactly flat at zero everywhere, despite every row having a strong individual effect", () => {
    const pdp = pdpCurve();
    expect(pdp).toEqual([0, 0, 0, 0, 0]);
  });

  it("ICE spread grows with distance from the center, even though the PDP never moves", () => {
    const spreads = X1_GRID.map((_, i) => iceSpreadAt(i));
    expect(spreads).toEqual([8, 4, 0, 4, 8]);
    expect(spreads[2]).toBe(0);
    expect(spreads[0]).toBeGreaterThan(0);
  });
});
