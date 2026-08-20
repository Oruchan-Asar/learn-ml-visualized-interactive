import { describe, expect, it } from "vitest";
import {
  valueOf,
  BASELINE,
  FULL_VALUE,
  ALL_ORDERINGS,
  marginalContribution,
  shapleyValue,
  allShapleyValues,
} from "@/lib/math-core/shapley-values";

describe("the value function", () => {
  it("has a baseline of 50 and a full-team value of 80", () => {
    expect(BASELINE).toBe(50);
    expect(FULL_VALUE).toBe(80);
  });

  it("cheese and toppings together (65) beat their solo effects summed (2 + 3 = 5) by a wide margin — a real synergy", () => {
    const soloSum = (valueOf(["B"]) - BASELINE) + (valueOf(["C"]) - BASELINE);
    const together = valueOf(["B", "C"]) - BASELINE;
    expect(together).toBeGreaterThan(soloSum * 2);
  });
});

describe("marginal contribution depends on arrival order", () => {
  it("B's marginal contribution is 2 when it joins first, but 12 when C already joined", () => {
    expect(marginalContribution(["B", "A", "C"], "B")).toBe(2);
    expect(marginalContribution(["C", "B", "A"], "B")).toBe(12);
  });

  it("there are exactly 6 orderings of 3 features", () => {
    expect(ALL_ORDERINGS.length).toBe(6);
  });
});

describe("Shapley values", () => {
  it("are exactly A=29/3, B=61/6, C=61/6", () => {
    expect(shapleyValue("A")).toBeCloseTo(29 / 3, 10);
    expect(shapleyValue("B")).toBeCloseTo(61 / 6, 10);
    expect(shapleyValue("C")).toBeCloseTo(61 / 6, 10);
  });

  it("B and C tie despite different solo values, because they share the same synergy with each other", () => {
    expect(shapleyValue("B")).toBeCloseTo(shapleyValue("C"), 10);
  });

  it("satisfy the efficiency axiom: they sum to exactly the full value minus the baseline", () => {
    const values = allShapleyValues();
    const sum = values.A + values.B + values.C;
    expect(sum).toBeCloseTo(FULL_VALUE - BASELINE, 10);
  });
});
