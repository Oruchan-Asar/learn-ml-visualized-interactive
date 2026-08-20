import { describe, expect, it } from "vitest";
import { policy, policyGradientUpdate, runPolicyGradient, THETA_INIT } from "@/lib/math-core/policy-gradient-methods";

describe("the softmax policy", () => {
  it("is exactly uniform when all preferences are zero", () => {
    const pi = policy(THETA_INIT);
    expect(pi.A).toBeCloseTo(1 / 3, 10);
    expect(pi.B).toBeCloseTo(1 / 3, 10);
    expect(pi.C).toBeCloseTo(1 / 3, 10);
  });
});

describe("the REINFORCE update", () => {
  it("from a uniform policy, pulling A with reward 1 raises A by 1/3 and lowers B, C by 1/6 each", () => {
    const next = policyGradientUpdate(THETA_INIT, "A", 1);
    expect(next.A).toBeCloseTo(1 / 3, 10);
    expect(next.B).toBeCloseTo(-1 / 6, 10);
    expect(next.C).toBeCloseTo(-1 / 6, 10);
  });

  it("a reward of exactly 0 leaves every preference completely unchanged, regardless of which arm was pulled", () => {
    const theta = { A: 0.5, B: -0.2, C: 0.1 };
    const next = policyGradientUpdate(theta, "C", 0);
    expect(next).toEqual(theta);
  });
});

describe("the fixed 5-pull script", () => {
  const steps = runPolicyGradient();

  it("has exactly 5 steps, pulling A, B, C, B, B", () => {
    expect(steps.map((s) => s.arm)).toEqual(["A", "B", "C", "B", "B"]);
  });

  it("steps 3 and 5 (reward 0) leave theta completely unchanged", () => {
    expect(steps[2].thetaAfter).toEqual(steps[2].thetaBefore);
    expect(steps[4].thetaAfter).toEqual(steps[4].thetaBefore);
  });

  it("after all 5 pulls, B's preference clearly dominates A's and C's", () => {
    const final = steps[steps.length - 1].thetaAfter;
    expect(final.B).toBeGreaterThan(final.A);
    expect(final.B).toBeGreaterThan(final.C);
    expect(final.B).toBeCloseTo(0.498, 3);
  });

  it("the resulting policy favors B with more than half the probability mass", () => {
    const finalPolicy = policy(steps[steps.length - 1].thetaAfter);
    expect(finalPolicy.B).toBeGreaterThan(0.5);
  });
});
