import { describe, expect, it } from "vitest";
import {
  clip,
  unclippedObjective,
  clippedObjective,
  isClipActive,
  runRatioScript,
  EPSILON,
  ADVANTAGE,
} from "@/lib/math-core/proximal-policy-optimization-ppo";

describe("clip", () => {
  it("passes ratios inside [0.8, 1.2] through unchanged", () => {
    expect(clip(0.9)).toBe(0.9);
    expect(clip(1.0)).toBe(1.0);
    expect(clip(1.2)).toBe(1.2);
  });

  it("clamps ratios outside the range to exactly 0.8 or 1.2", () => {
    expect(clip(0.5)).toBe(0.8);
    expect(clip(1.5)).toBe(1.2);
  });
});

describe("the clipped surrogate objective, with A=1, epsilon=0.2", () => {
  it("matches the unclipped objective when the ratio hasn't moved much (r=0.9)", () => {
    expect(unclippedObjective(0.9)).toBeCloseTo(0.9, 10);
    expect(clippedObjective(0.9)).toBeCloseTo(0.9, 10);
    expect(isClipActive(0.9)).toBe(false);
  });

  it("is NOT clipped even below 1-epsilon, since the min already picks the lower unclipped value (r=0.7)", () => {
    expect(unclippedObjective(0.7)).toBeCloseTo(0.7, 10);
    expect(clippedObjective(0.7)).toBeCloseTo(0.7, 10);
    expect(isClipActive(0.7)).toBe(false);
  });

  it("flattens at 1.2 once the ratio moves past 1+epsilon (r=1.3)", () => {
    expect(unclippedObjective(1.3)).toBeCloseTo(1.3, 10);
    expect(clippedObjective(1.3)).toBeCloseTo(1.2, 10);
    expect(isClipActive(1.3)).toBe(true);
  });

  it("stays flat at 1.2 for an even larger ratio (r=1.5) — the clip caps the reward for moving further", () => {
    expect(clippedObjective(1.5)).toBeCloseTo(1.2, 10);
    expect(isClipActive(1.5)).toBe(true);
  });
});

describe("the fixed ratio script", () => {
  const checks = runRatioScript();

  it("has exactly 6 checks", () => {
    expect(checks.length).toBe(6);
  });

  it("the clip only ever activates for ratios above 1+epsilon, never below", () => {
    const activeRatios = checks.filter((c) => c.clipActive).map((c) => c.r);
    expect(activeRatios).toEqual([1.3, 1.5]);
  });

  it("defaults are epsilon=0.2 and advantage=1", () => {
    expect(EPSILON).toBe(0.2);
    expect(ADVANTAGE).toBe(1);
  });
});
