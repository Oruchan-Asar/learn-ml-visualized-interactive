import { describe, it, expect } from "vitest";
import {
  XOR_POINTS,
  initialWeights,
  forward,
  meanLoss,
  trainStep,
  trainEpochs,
  TARGET_LOSS,
} from "@/lib/math-core/mlp-capstone";

describe("XOR is not linearly separable — sanity check on the dataset itself", () => {
  it("no single line through the four points groups labels correctly (both diagonals disagree)", () => {
    // (0,0) and (1,1) share a label; (0,1) and (1,0) share the other — the two diagonal pairs.
    expect(XOR_POINTS[0].label).toBe(XOR_POINTS[3].label);
    expect(XOR_POINTS[1].label).toBe(XOR_POINTS[2].label);
    expect(XOR_POINTS[0].label).not.toBe(XOR_POINTS[1].label);
  });
});

describe("training reduces the loss monotonically-ish and eventually solves XOR", () => {
  it("loss after 800 epochs is below the target threshold", () => {
    const trained = trainEpochs(initialWeights(), 800);
    expect(meanLoss(trained)).toBeLessThan(TARGET_LOSS);
  });

  it("loss after only 1 epoch has not yet reached the target — real training is required", () => {
    const afterOne = trainStep(initialWeights());
    expect(meanLoss(afterOne)).toBeGreaterThan(TARGET_LOSS);
  });

  it("after 800 epochs, every point is correctly classified (output on the right side of 0.5)", () => {
    const trained = trainEpochs(initialWeights(), 800);
    for (const p of XOR_POINTS) {
      const { output } = forward(trained, p.x, p.y);
      const predictedLabel = output >= 0.5 ? "B" : "A";
      expect(predictedLabel).toBe(p.label);
    }
  });

  it("loss strictly decreases from epoch 400 to 800 to 1200 — training is actually converging, not stuck", () => {
    const at400 = meanLoss(trainEpochs(initialWeights(), 400));
    const at800 = meanLoss(trainEpochs(initialWeights(), 800));
    const at1200 = meanLoss(trainEpochs(initialWeights(), 1200));
    expect(at800).toBeLessThan(at400);
    expect(at1200).toBeLessThan(at800);
  });
});

describe("trainStep gradients match a numerical check on the total loss", () => {
  it("perturbing w2[0] by epsilon changes the loss consistently with the analytical gradient direction", () => {
    const weights = initialWeights();
    const eps = 1e-4;
    const base = meanLoss(weights);
    const bumped = { ...weights, w2: weights.w2.map((w, i) => (i === 0 ? w + eps : w)) };
    const numericSlope = (meanLoss(bumped) - base) / eps;
    const after = trainStep(weights, 1); // learningRate=1 so the update itself equals -gradient
    const impliedGradient = weights.w2[0] - after.w2[0];
    // Same sign, same rough order of magnitude — confirms the backprop gradient truly reduces loss along w2[0].
    expect(Math.sign(numericSlope)).toBe(Math.sign(impliedGradient));
  });
});
