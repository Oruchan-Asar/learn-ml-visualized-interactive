import { describe, it, expect } from "vitest";
import {
  TRAJECTORY,
  RISKY_STEP,
  MAX_SAFE_RISK,
  RISKY_RISK,
  needsApproval,
  flaggedSteps,
  correctlySeparates,
} from "@/lib/math-core/human-in-the-loop-agent-systems";

describe("human-in-the-loop-agent-systems", () => {
  it("has a 5-step trajectory with exactly one truly risky action", () => {
    expect(TRAJECTORY).toHaveLength(5);
    expect(RISKY_STEP).toBe(4);
    expect(RISKY_RISK).toBe(9);
    expect(MAX_SAFE_RISK).toBe(3);
  });

  it("a threshold of 0 flags every action", () => {
    expect(flaggedSteps(0)).toEqual([1, 2, 3, 4, 5]);
    expect(correctlySeparates(0)).toBe(false);
  });

  it("a threshold above the risky action's score flags nothing", () => {
    expect(flaggedSteps(10)).toEqual([]);
    expect(correctlySeparates(10)).toBe(false);
  });

  it("thresholds strictly between the max safe risk and the risky risk correctly separate the trajectory", () => {
    for (const t of [4, 5, 6, 7, 8, 9]) {
      expect(correctlySeparates(t)).toBe(true);
      expect(flaggedSteps(t)).toEqual([RISKY_STEP]);
    }
  });

  it("a threshold of exactly the max safe risk also flags a safe action", () => {
    expect(needsApproval(TRAJECTORY[2], MAX_SAFE_RISK)).toBe(true);
    expect(correctlySeparates(MAX_SAFE_RISK)).toBe(false);
  });

  it("a threshold one above the max safe risk is the smallest correctly-separating threshold", () => {
    expect(correctlySeparates(MAX_SAFE_RISK + 1)).toBe(true);
    expect(correctlySeparates(MAX_SAFE_RISK)).toBe(false);
  });
});
