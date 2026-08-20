import { describe, expect, it } from "vitest";
import { fitRewardModel, rewardModelStep, trainPolicyFromRewardModel, policy, REWARD_MODEL_STEPS } from "@/lib/math-core/rlhf";

describe("fitting a reward model from pairwise preferences alone", () => {
  it("A stays fixed at 0 (the reference point) across every step", () => {
    const trace = fitRewardModel(REWARD_MODEL_STEPS);
    for (const r of trace) expect(r.A).toBe(0);
  });

  it("after the first gradient step, B rises to exactly 0.5 while C stays at exactly 0", () => {
    const step1 = rewardModelStep({ A: 0, B: 0, C: 0 });
    expect(step1.B).toBeCloseTo(0.5, 10);
    expect(step1.C).toBeCloseTo(0, 10);
  });

  it("C's zero-movement on step 1 is a real cancellation: it wins one comparison and loses one, both against parties still at 0", () => {
    // Confirmed structurally: C's total gradient is (loses to nothing yet against B, at parity) + (beats A, at parity) = 0 net, at initialization.
    const step1 = rewardModelStep({ A: 0, B: 0, C: 0 });
    expect(step1.C).toBe(0);
  });

  it("after 3 steps, the fitted rewards recover the true preference order B > C > A", () => {
    const trace = fitRewardModel(REWARD_MODEL_STEPS);
    const final = trace[trace.length - 1];
    expect(final.B).toBeGreaterThan(final.C);
    expect(final.C).toBeGreaterThan(final.A);
    expect(final.B).toBeCloseTo(1.1777, 3);
    expect(final.C).toBeCloseTo(0.1503, 3);
  });
});

describe("training a policy from the fitted reward model", () => {
  it("starts from a uniform policy", () => {
    const trace = fitRewardModel(REWARD_MODEL_STEPS);
    const final = trace[trace.length - 1];
    const { policyBefore } = trainPolicyFromRewardModel(final);
    expect(policyBefore.A).toBeCloseTo(1 / 3, 10);
    expect(policyBefore.B).toBeCloseTo(1 / 3, 10);
    expect(policyBefore.C).toBeCloseTo(1 / 3, 10);
  });

  it("ends up clearly preferring B, the response with the highest fitted reward", () => {
    const trace = fitRewardModel(REWARD_MODEL_STEPS);
    const final = trace[trace.length - 1];
    const { theta } = trainPolicyFromRewardModel(final);
    const finalPolicy = policy(theta);
    expect(finalPolicy.B).toBeGreaterThan(finalPolicy.A);
    expect(finalPolicy.B).toBeGreaterThan(finalPolicy.C);
    expect(finalPolicy.B).toBeCloseTo(0.4605, 3);
  });
});
