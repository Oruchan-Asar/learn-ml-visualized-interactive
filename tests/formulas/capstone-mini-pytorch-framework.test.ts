import { describe, it, expect } from "vitest";
import {
  initialWeights,
  initialAdamWState,
  forward,
  meanLoss,
  computeGradients,
  adamWUpdate,
  adamWStep,
  trainEpochs,
  TARGET_LOSS,
  EPOCHS_PER_STEP,
} from "@/lib/math-core/capstone-mini-pytorch-framework";

describe("forward pass and loss at the deterministic initial weights", () => {
  it("meanLoss starts at the same fixed value every run (seeded init)", () => {
    expect(meanLoss(initialWeights())).toBeCloseTo(0.136243, 5);
  });

  it("forward's output matches a hand-recomputed sigmoid(sigmoid-combination) at (0,0)", () => {
    const w = initialWeights();
    const { h, output } = forward(w, 0, 0);
    const z2 = h.reduce((sum, hi, i) => sum + w.w2[i] * hi, 0) + w.b2;
    expect(output).toBeCloseTo(1 / (1 + Math.exp(-z2)), 10);
  });
});

describe("computeGradients matches a numerical (finite-difference) gradient check", () => {
  it("agrees with (loss(theta+e)-loss(theta-e))/(2e) for every entry of w2", () => {
    const w = initialWeights();
    const grads = computeGradients(w);
    const eps = 1e-6;
    for (let i = 0; i < w.w2.length; i++) {
      const plus = { ...w, w2: w.w2.map((v, j) => (j === i ? v + eps : v)) };
      const minus = { ...w, w2: w.w2.map((v, j) => (j === i ? v - eps : v)) };
      const numeric = (meanLoss(plus) - meanLoss(minus)) / (2 * eps);
      expect(grads.w2[i]).toBeCloseTo(numeric, 5);
    }
  });

  it("agrees with a numerical gradient for b2 and for w1[0][0]", () => {
    const w = initialWeights();
    const grads = computeGradients(w);
    const eps = 1e-6;

    const plusB2 = { ...w, b2: w.b2 + eps };
    const minusB2 = { ...w, b2: w.b2 - eps };
    expect(grads.b2).toBeCloseTo((meanLoss(plusB2) - meanLoss(minusB2)) / (2 * eps), 5);

    const plusW1 = { ...w, w1: w.w1.map((row, i) => (i === 0 ? [row[0] + eps, row[1]] : row)) };
    const minusW1 = { ...w, w1: w.w1.map((row, i) => (i === 0 ? [row[0] - eps, row[1]] : row)) };
    expect(grads.w1[0][0]).toBeCloseTo((meanLoss(plusW1) - meanLoss(minusW1)) / (2 * eps), 5);
  });
});

describe("adamWUpdate's first step (t=1, m=v=0) reduces to lr*(sign(g) + weightDecay*theta)", () => {
  it("matches the exact hand-derived first AdamW update on w2[0]", () => {
    const w = initialWeights();
    const grads = computeGradients(w);
    const theta = w.w2[0];
    const g = grads.w2[0];
    expect(theta).toBeCloseTo(0.166168, 5);
    expect(g).toBeCloseTo(-0.012081, 5);

    const result = adamWUpdate(theta, g, 0, 0, 1);
    // At t=1 with zero-initialized moments, m-hat = g and v-hat = g^2 exactly,
    // so the ratio m-hat/sqrt(v-hat) collapses to sign(g).
    expect(result.theta).toBeCloseTo(0.266002, 5);
  });
});

describe("adamWStep drives the network toward solving XOR", () => {
  it("meanLoss strictly decreases over the first training step", () => {
    const state = initialAdamWState();
    const before = meanLoss(state.weights);
    const after = meanLoss(adamWStep(state).weights);
    expect(after).toBeLessThan(before);
  });

  it("reaches the target loss within a handful of EPOCHS_PER_STEP-sized clicks", () => {
    const state = trainEpochs(initialAdamWState(), EPOCHS_PER_STEP * 6);
    expect(meanLoss(state.weights)).toBeLessThan(TARGET_LOSS);
  });

  it("every one of the 4 XOR points is on the correct side of 0.5 once trained", () => {
    const state = trainEpochs(initialAdamWState(), EPOCHS_PER_STEP * 6);
    const targets = [0, 1, 1, 0];
    const points: [number, number][] = [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ];
    points.forEach(([x, y], i) => {
      const { output } = forward(state.weights, x, y);
      expect(output > 0.5 ? 1 : 0).toBe(targets[i]);
    });
  });
});
