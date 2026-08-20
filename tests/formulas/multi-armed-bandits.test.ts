import { describe, expect, it } from "vitest";
import { ARMS, trueMean, estimate, bestArm, runScript } from "@/lib/math-core/multi-armed-bandits";

describe("the three arms have distinct, fixed true means", () => {
  it("B is the best arm (0.8), A is middling (0.5), C is poor (0.2)", () => {
    expect(trueMean("A")).toBeCloseTo(0.5, 10);
    expect(trueMean("B")).toBeCloseTo(0.8, 10);
    expect(trueMean("C")).toBeCloseTo(0.2, 10);
  });
});

describe("estimate and bestArm", () => {
  it("estimate of no pulls is 0, of [1,0,1] is 2/3", () => {
    expect(estimate([])).toBe(0);
    expect(estimate([1, 0, 1])).toBeCloseTo(2 / 3, 10);
  });

  it("bestArm breaks ties alphabetically", () => {
    expect(bestArm({ A: [1], B: [1], C: [0] })).toBe("A");
    expect(bestArm({ A: [0], B: [1], C: [1] })).toBe("B");
  });
});

describe("the fixed 8-step epsilon-greedy script", () => {
  const steps = runScript();

  it("has exactly 8 steps, alternating explore/exploit per the fixed schedule", () => {
    expect(steps.map((s) => s.action)).toEqual([
      "explore", "explore", "explore", "exploit", "exploit", "explore", "exploit", "exploit",
    ]);
  });

  it("explore steps cycle through A, B, C in order", () => {
    const exploreSteps = steps.filter((s) => s.action === "explore");
    expect(exploreSteps.map((s) => s.arm)).toEqual(["A", "B", "C", "A"]);
  });

  it("collects exactly 4 total reward across all 8 pulls", () => {
    const total = steps.reduce((s, st) => s + st.reward, 0);
    expect(total).toBe(4);
  });

  it("ends with A pulled 4 times (avg 0.5) and B pulled 3 times (avg 2/3), having never fully discovered B is best", () => {
    const last = steps[steps.length - 1];
    expect(last.rewardsByArm.A.length).toBe(4);
    expect(last.rewardsByArm.B.length).toBe(3);
    expect(last.estimates.A).toBeCloseTo(0.5, 10);
    expect(last.estimates.B).toBeCloseTo(2 / 3, 10);
  });

  it("every arm in ARMS appears in at least one step", () => {
    const armsUsed = new Set(steps.map((s) => s.arm));
    for (const arm of ARMS) expect(armsUsed.has(arm)).toBe(true);
  });
});
