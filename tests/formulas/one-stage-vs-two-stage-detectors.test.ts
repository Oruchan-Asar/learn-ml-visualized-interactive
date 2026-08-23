import { describe, it, expect } from "vitest";
import {
  BOXES,
  oneStageScore,
  proposalScore,
  twoStageScore,
  isDetected,
  oneStageCost,
  twoStageCost,
  proposalSurvivorCount,
  detectionDisagreements,
  DETECTION_THRESHOLD,
} from "@/lib/math-core/one-stage-vs-two-stage-detectors";

const box = (id: string) => BOXES.find((b) => b.id === id)!;

describe("one-stage-vs-two-stage-detectors", () => {
  it("one-stage quantizes every box's true confidence onto a coarse 0.1 grid", () => {
    expect(oneStageScore(box("A").trueConfidence)).toBe(0.9);
    expect(oneStageScore(box("C").trueConfidence)).toBe(0.5);
    expect(oneStageScore(box("D").trueConfidence)).toBe(0.2);
  });

  it("two-stage's proposal pass drops box D before the expensive refine pass ever sees it", () => {
    expect(proposalScore(box("D").trueConfidence)).toBe(0.25);
    expect(twoStageScore(box("D").trueConfidence)).toBe(0);
    expect(proposalSurvivorCount()).toBe(5);
  });

  it("two-stage's surviving boxes get their exact true confidence back, not a rounded one", () => {
    expect(twoStageScore(box("A").trueConfidence)).toBe(0.92);
    expect(twoStageScore(box("F").trueConfidence)).toBe(0.56);
  });

  it("one-stage's coarse rounding flips box C's detection call; two-stage's refine pass corrects it", () => {
    const oneStage = oneStageScore(box("C").trueConfidence);
    const twoStage = twoStageScore(box("C").trueConfidence);
    expect(isDetected(oneStage)).toBe(true); // 0.5 >= threshold
    expect(isDetected(twoStage)).toBe(false); // 0.47 < threshold
    expect(detectionDisagreements()).toEqual(["C"]);
  });

  it("two-stage costs far more total compute than one-stage on this scene", () => {
    expect(oneStageCost()).toBe(6);
    expect(twoStageCost()).toBeCloseTo(16.2, 10);
    expect(twoStageCost()).toBeGreaterThan(oneStageCost());
  });

  it("DETECTION_THRESHOLD is the shared cutoff both pipelines are judged against", () => {
    expect(DETECTION_THRESHOLD).toBe(0.5);
  });
});
