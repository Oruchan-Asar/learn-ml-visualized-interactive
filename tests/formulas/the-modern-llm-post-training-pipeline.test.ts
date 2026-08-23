import { describe, it, expect } from "vitest";
import { BASE_ACCURACY, STAGES, STAGE_ACCURACY, accuracyBeforeStage, stageGain, allStageGains, totalGain } from "@/lib/math-core/the-modern-llm-post-training-pipeline";

describe("accuracyBeforeStage", () => {
  it("stage 0 (SFT) starts from the base pretrained accuracy", () => {
    expect(accuracyBeforeStage(0)).toBe(BASE_ACCURACY);
  });

  it("later stages start from the previous stage's output", () => {
    expect(accuracyBeforeStage(1)).toBe(STAGE_ACCURACY.SFT);
    expect(accuracyBeforeStage(2)).toBe(STAGE_ACCURACY["Preference-optimized"]);
  });
});

describe("stageGain", () => {
  it("matches the hand-computed marginal gain per stage", () => {
    expect(stageGain(0)).toBeCloseTo(0.3, 10); // 0.45 - 0.15
    expect(stageGain(1)).toBeCloseTo(0.17, 10); // 0.62 - 0.45
    expect(stageGain(2)).toBeCloseTo(0.19, 10); // 0.81 - 0.62
  });
});

describe("allStageGains", () => {
  it("returns one gain per stage, in pipeline order", () => {
    const gains = allStageGains();
    expect(gains).toHaveLength(STAGES.length);
    expect(gains[0]).toBeCloseTo(0.3, 10);
    expect(gains[2]).toBeCloseTo(0.19, 10);
  });
});

describe("totalGain", () => {
  it("matches the hand-computed total improvement: 0.81 - 0.15 = 0.66", () => {
    expect(totalGain()).toBeCloseTo(0.66, 10);
  });

  it("equals the sum of the individual stage gains", () => {
    const sumOfGains = allStageGains().reduce((s, g) => s + g, 0);
    expect(totalGain()).toBeCloseTo(sumOfGains, 8);
  });
});
