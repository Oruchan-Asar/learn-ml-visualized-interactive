import { describe, it, expect } from "vitest";
import { verify, verifiableReward, meanReward, bestByVerifier, bestByLearnedReward, SAMPLES, CORRECT_ANSWER } from "@/lib/math-core/reinforcement-learning-with-verifiable-rewards-rlvr";

describe("verify", () => {
  it("matches the exact correct answer", () => {
    expect(verify("43")).toBe(true);
    expect(verify(CORRECT_ANSWER)).toBe(true);
  });

  it("rejects any other answer", () => {
    expect(verify("39")).toBe(false);
    expect(verify("44")).toBe(false);
  });

  it("tolerates surrounding whitespace", () => {
    expect(verify("  43  ")).toBe(true);
  });
});

describe("verifiableReward", () => {
  it("is 1 for correct samples and 0 for incorrect ones, matching SAMPLES exactly", () => {
    expect(SAMPLES.map((s) => verifiableReward(s))).toEqual([1, 0, 1, 0]);
  });
});

describe("meanReward", () => {
  it("mean verifiable reward across the 4 samples is 0.5", () => {
    expect(meanReward(SAMPLES.map((s) => verifiableReward(s)))).toBeCloseTo(0.5, 10);
  });

  it("mean learned-reward-model guess is 0.545 -- close to the verifiable mean in aggregate", () => {
    expect(meanReward(SAMPLES.map((s) => s.learnedRewardGuess))).toBeCloseTo(0.545, 10);
  });
});

describe("bestByVerifier vs bestByLearnedReward", () => {
  it("the verifier picks a genuinely correct response", () => {
    const best = bestByVerifier();
    expect(verify(best.answer)).toBe(true);
    expect(best.id).toBe("1");
  });

  it("the hypothetical learned reward model picks a WRONG response -- the reward-hacking failure mode RLVR sidesteps", () => {
    const best = bestByLearnedReward();
    expect(verify(best.answer)).toBe(false);
    expect(best.id).toBe("2");
    expect(best.learnedRewardGuess).toBe(0.71);
  });
});
