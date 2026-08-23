import { describe, it, expect } from "vitest";
import { verifyGroup, trainStep, CAPSTONE_GROUP, CAPSTONE_ANSWER, verify } from "@/lib/math-core/capstone-train-a-reasoning-model-grpo";

describe("verifyGroup (reusing RLVR's verifier)", () => {
  it("verifies each of the 5 sampled responses: 4 correct, 1 wrong", () => {
    expect(verifyGroup()).toEqual([1, 1, 1, 1, 0]);
  });

  it("CAPSTONE_ANSWER matches exactly the 4 identical correct responses in the group", () => {
    const correctCount = CAPSTONE_GROUP.filter((r) => verify(r.answer, CAPSTONE_ANSWER)).length;
    expect(correctCount).toBe(4);
  });
});

describe("trainStep (reusing GRPO's group-relative advantage)", () => {
  it("matches the hand-computed group statistics: mean 0.8, std 0.4", () => {
    const result = trainStep();
    expect(result.rewards).toEqual([1, 1, 1, 1, 0]);
    expect(result.mean).toBeCloseTo(0.8, 10);
    expect(result.std).toBeCloseTo(0.4, 10);
  });

  it("the 4 correct responses each get advantage +0.5; the 1 wrong response gets -2.0 -- the same split GRPO's own chapter found for its 4-correct-1-wrong group", () => {
    const { advantages } = trainStep();
    expect(advantages[0]).toBeCloseTo(0.5, 8);
    expect(advantages[1]).toBeCloseTo(0.5, 8);
    expect(advantages[2]).toBeCloseTo(0.5, 8);
    expect(advantages[3]).toBeCloseTo(0.5, 8);
    expect(advantages[4]).toBeCloseTo(-2, 8);
  });

  it("uses no external reward model or critic -- rewards come only from verify(), advantages only from the group's own stats", () => {
    const result = trainStep();
    const recomputedRewards = CAPSTONE_GROUP.map((r) => (verify(r.answer, CAPSTONE_ANSWER) ? 1 : 0));
    expect(result.rewards).toEqual(recomputedRewards);
  });
});
