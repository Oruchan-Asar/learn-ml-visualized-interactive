import { describe, it, expect } from "vitest";
import { temporalAttentionWeights, FRAMES, temporalDistance, inLocalWindow } from "@/lib/math-core/video-understanding";

describe("video-understanding", () => {
  it("frame 0 and frame 4 are 4 frames apart, outside a local window of size 1", () => {
    expect(temporalDistance(FRAMES[0], FRAMES[4])).toBe(4);
    expect(inLocalWindow(FRAMES[0], FRAMES[4])).toBe(false);
  });

  it("frame 0 and frame 1 are adjacent, inside a local window of size 1", () => {
    expect(temporalDistance(FRAMES[0], FRAMES[1])).toBe(1);
    expect(inLocalWindow(FRAMES[0], FRAMES[1])).toBe(true);
  });

  it("self-attention gives frame 0 substantial weight on frame 4, despite the temporal gap", () => {
    const weights = temporalAttentionWeights(0);
    expect(weights[4]).toBeCloseTo(0.3147309269309434, 12);
    expect(weights[4]).toBeGreaterThan(0.25);
  });

  it("attention groups frames by motion state, not by temporal proximity", () => {
    const weights = temporalAttentionWeights(0);
    const highSum = weights[0] + weights[2] + weights[4];
    const lowSum = weights[1] + weights[3] + weights[5];
    expect(highSum).toBeCloseTo(0.9441927807928302, 10);
    expect(lowSum).toBeCloseTo(0.05580721920716973, 10);
    expect(highSum).toBeGreaterThan(lowSum * 16);
  });
});
