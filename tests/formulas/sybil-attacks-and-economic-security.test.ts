import { describe, it, expect } from "vitest";
import {
  TOTAL_POW_COST,
  TOTAL_STAKE_VALUE,
  MAJORITY_THRESHOLD,
  sybilCost,
  attackCost,
  powAttackCost,
  posAttackCost,
  isPricedOut,
} from "@/lib/math-core/sybil-attacks-and-economic-security";

describe("sybilCost — free identity creation", () => {
  it("costs nothing to create any number of identities with no resource requirement", () => {
    expect(sybilCost(1)).toBe(0);
    expect(sybilCost(1000)).toBe(0);
    expect(sybilCost(1_000_000)).toBe(0);
  });

  it("scales with a nonzero cost per identity", () => {
    expect(sybilCost(1000, 5)).toBe(5000);
  });
});

describe("attackCost", () => {
  it("is proportional to the share of the resource needed", () => {
    expect(attackCost(0.1, 1_000_000)).toBe(100_000);
    expect(attackCost(0.5, 1_000_000)).toBe(500_000);
    expect(attackCost(1, 1_000_000)).toBe(1_000_000);
  });
});

describe("powAttackCost and posAttackCost", () => {
  it("matches hand-worked 51% attack costs on the fixed scenario totals", () => {
    expect(powAttackCost()).toBeCloseTo(510_000);
    expect(posAttackCost()).toBeCloseTo(1_020_000);
  });

  it("costs more to attack the larger-valued stake pool than the hash-power pool", () => {
    expect(posAttackCost()).toBeGreaterThan(powAttackCost());
  });

  it("scales with an arbitrary target share", () => {
    expect(powAttackCost(0.1)).toBeCloseTo(TOTAL_POW_COST * 0.1);
    expect(posAttackCost(0.1)).toBeCloseTo(TOTAL_STAKE_VALUE * 0.1);
  });
});

describe("isPricedOut", () => {
  const BUDGET = 500_000;

  it("is false just below the majority threshold and true just above it", () => {
    expect(isPricedOut(attackCost(0.49, TOTAL_POW_COST), BUDGET)).toBe(false);
    expect(isPricedOut(attackCost(0.5, TOTAL_POW_COST), BUDGET)).toBe(false);
    expect(isPricedOut(attackCost(MAJORITY_THRESHOLD, TOTAL_POW_COST), BUDGET)).toBe(true);
  });

  it("a free Sybil attack is never priced out, no matter the budget", () => {
    expect(isPricedOut(sybilCost(1_000_000), 1)).toBe(false);
  });
});
