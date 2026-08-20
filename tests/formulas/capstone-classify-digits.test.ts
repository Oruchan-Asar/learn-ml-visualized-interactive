import { describe, it, expect } from "vitest";
import {
  TRAINING_SET,
  CLASS_LABELS,
  TARGET_LOSS,
  initialWeights,
  meanLoss,
  trainStep,
  trainEpochs,
  predict,
  forward,
  type CnnWeights,
} from "@/lib/math-core/capstone-classify-digits";

const EPS = 1e-4;

function cloneWeights(weights: CnnWeights): CnnWeights {
  return JSON.parse(JSON.stringify(weights));
}

/** Perturbs one scalar parameter by EPS and checks the numeric slope of the loss agrees in
 *  sign with the analytical gradient implied by a single trainStep (learning rate 1, so the
 *  update itself equals -gradient/n). */
function checkGradientSign(bump: (w: CnnWeights) => void, read: (w: CnnWeights) => number) {
  const weights = initialWeights();
  const base = meanLoss(weights);
  const bumped = cloneWeights(weights);
  bump(bumped);
  const numericSlope = (meanLoss(bumped) - base) / EPS;
  const after = trainStep(weights, 1);
  const impliedGradient = read(weights) - read(after);
  return { numericSlope, impliedGradient };
}

describe("dataset sanity", () => {
  it("has two classes, two examples each, matching CLASS_LABELS", () => {
    expect(TRAINING_SET.filter((ex) => ex.label === 0)).toHaveLength(2);
    expect(TRAINING_SET.filter((ex) => ex.label === 1)).toHaveLength(2);
    expect(CLASS_LABELS).toHaveLength(2);
  });

  it("every image is 6x6", () => {
    for (const ex of TRAINING_SET) {
      expect(ex.image).toHaveLength(6);
      for (const row of ex.image) expect(row).toHaveLength(6);
    }
  });
});

describe("backprop gradients match numerical finite differences", () => {
  it("a kernel weight's gradient sign matches", () => {
    const { numericSlope, impliedGradient } = checkGradientSign(
      (w) => (w.kernels[1][2][1] += EPS),
      (w) => w.kernels[1][2][1],
    );
    expect(Math.sign(numericSlope)).toBe(Math.sign(impliedGradient));
  });

  it("a kernel bias's gradient sign matches", () => {
    const { numericSlope, impliedGradient } = checkGradientSign(
      (w) => (w.kernelBias[0] += EPS),
      (w) => w.kernelBias[0],
    );
    expect(Math.sign(numericSlope)).toBe(Math.sign(impliedGradient));
  });

  it("a dense weight's gradient sign matches", () => {
    const { numericSlope, impliedGradient } = checkGradientSign(
      (w) => (w.denseWeights[1][6] += EPS),
      (w) => w.denseWeights[1][6],
    );
    expect(Math.sign(numericSlope)).toBe(Math.sign(impliedGradient));
  });

  it("a dense bias's gradient sign matches", () => {
    const { numericSlope, impliedGradient } = checkGradientSign(
      (w) => (w.denseBias[0] += EPS),
      (w) => w.denseBias[0],
    );
    expect(Math.sign(numericSlope)).toBe(Math.sign(impliedGradient));
  });
});

describe("training converges and correctly classifies every example", () => {
  it("loss after only 1 epoch has not yet reached the target — real training is required", () => {
    const afterOne = trainStep(initialWeights());
    expect(meanLoss(afterOne)).toBeGreaterThan(TARGET_LOSS);
  });

  it("loss after 20 epochs is below the target threshold", () => {
    const trained = trainEpochs(initialWeights(), 20);
    expect(meanLoss(trained)).toBeLessThan(TARGET_LOSS);
  });

  it("loss strictly decreases from epoch 10 to 20 to 30 — training is actually converging", () => {
    const at10 = meanLoss(trainEpochs(initialWeights(), 10));
    const at20 = meanLoss(trainEpochs(initialWeights(), 20));
    const at30 = meanLoss(trainEpochs(initialWeights(), 30));
    expect(at20).toBeLessThan(at10);
    expect(at30).toBeLessThan(at20);
  });

  it("after 20 epochs, every training example is classified correctly", () => {
    const trained = trainEpochs(initialWeights(), 20);
    for (const ex of TRAINING_SET) {
      expect(predict(trained, ex.image)).toBe(ex.label);
    }
  });

  it("before training, the network does not already solve the task perfectly", () => {
    const fresh = initialWeights();
    const predictions = TRAINING_SET.map((ex) => predict(fresh, ex.image));
    const allCorrect = predictions.every((p, i) => p === TRAINING_SET[i].label);
    expect(allCorrect).toBe(false);
  });
});

describe("forward pass produces valid probabilities", () => {
  it("probabilities sum to 1 and are all non-negative", () => {
    const weights = initialWeights();
    for (const ex of TRAINING_SET) {
      const { probs } = forward(weights, ex.image);
      expect(probs.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
      for (const p of probs) expect(p).toBeGreaterThanOrEqual(0);
    }
  });
});
