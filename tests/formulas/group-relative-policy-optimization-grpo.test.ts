import { describe, it, expect } from "vitest";
import { GROUP_A, GROUP_B, rewardsOf, groupMean, groupStd, groupAdvantage } from "@/lib/math-core/group-relative-policy-optimization-grpo";

describe("groupMean / groupStd", () => {
  it("GROUP_A (4 correct, 1 wrong): mean 0.8, std 0.4", () => {
    const rewards = rewardsOf(GROUP_A);
    expect(groupMean(rewards)).toBeCloseTo(0.8, 10);
    expect(groupStd(rewards)).toBeCloseTo(0.4, 10);
  });

  it("GROUP_B (1 correct, 4 wrong): mean 0.2, std 0.4", () => {
    const rewards = rewardsOf(GROUP_B);
    expect(groupMean(rewards)).toBeCloseTo(0.2, 10);
    expect(groupStd(rewards)).toBeCloseTo(0.4, 10);
  });
});

describe("groupAdvantage", () => {
  it("GROUP_A: the four correct responses each get +0.5, the one wrong response gets -2.0", () => {
    const advantages = groupAdvantage(rewardsOf(GROUP_A));
    expect(advantages).toHaveLength(5);
    expect(advantages[0]).toBeCloseTo(0.5, 8);
    expect(advantages[1]).toBeCloseTo(0.5, 8);
    expect(advantages[2]).toBeCloseTo(0.5, 8);
    expect(advantages[3]).toBeCloseTo(0.5, 8);
    expect(advantages[4]).toBeCloseTo(-2, 8);
  });

  it("GROUP_B: the one correct response gets +2.0, the four wrong responses each get -0.5 -- a mirror image of GROUP_A", () => {
    const advantages = groupAdvantage(rewardsOf(GROUP_B));
    expect(advantages[0]).toBeCloseTo(2, 8);
    expect(advantages[1]).toBeCloseTo(-0.5, 8);
    expect(advantages[2]).toBeCloseTo(-0.5, 8);
    expect(advantages[3]).toBeCloseTo(-0.5, 8);
    expect(advantages[4]).toBeCloseTo(-0.5, 8);
  });

  it("requires no external baseline -- advantages are a pure function of the group's own rewards", () => {
    const rewards = [1, 1, 0];
    const advantages = groupAdvantage(rewards);
    const mean = groupMean(rewards);
    const std = groupStd(rewards);
    expect(advantages).toEqual(rewards.map((r) => (r - mean) / std));
  });
});
