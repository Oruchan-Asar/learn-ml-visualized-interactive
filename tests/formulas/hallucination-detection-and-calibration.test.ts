import { describe, it, expect } from "vitest";
import { PREDICTIONS, isTrusted, separationAccuracy } from "@/lib/math-core/hallucination-detection-and-calibration";

describe("isTrusted", () => {
  it("trusts confidence at or above the threshold", () => {
    expect(isTrusted(0.7, 0.7)).toBe(true);
    expect(isTrusted(0.69, 0.7)).toBe(false);
  });
});

describe("separationAccuracy", () => {
  it("achieves perfect separation for any threshold strictly above 0.70 and up to 0.85", () => {
    expect(separationAccuracy(0.75)).toBe(1);
    expect(separationAccuracy(0.71)).toBe(1);
    expect(separationAccuracy(0.85)).toBe(1);
  });

  it("misses the overconfident hallucination when the threshold is too low", () => {
    expect(separationAccuracy(0.5)).toBeCloseTo(5 / 7, 10);
  });

  it("starts flagging genuinely correct answers when the threshold is too high", () => {
    expect(separationAccuracy(0.9)).toBeCloseTo(6 / 7, 10);
  });

  it("has exactly seven toy predictions", () => {
    expect(PREDICTIONS).toHaveLength(7);
  });
});
