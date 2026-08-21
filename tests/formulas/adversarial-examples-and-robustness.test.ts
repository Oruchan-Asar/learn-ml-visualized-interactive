import { describe, it, expect } from "vitest";
import { predict, perturb, fgsmPerturbation, ORIGINAL_INPUT, EPSILON_CANDIDATES, WEIGHTS, BIAS } from "@/lib/math-core/adversarial-examples-and-robustness";

describe("predict", () => {
  it("classifies the original input confidently positive", () => {
    const confidence = predict(ORIGINAL_INPUT);
    expect(confidence).toBeCloseTo(1 / (1 + Math.exp(-0.9)), 10);
    expect(confidence).toBeGreaterThan(0.5);
  });
});

describe("fgsmPerturbation", () => {
  it("moves every dimension by exactly -epsilon, since every weight is positive", () => {
    const delta = fgsmPerturbation(0.15);
    expect(delta).toEqual(Array(9).fill(-0.15));
  });
});

describe("perturb", () => {
  it("changes each pixel by at most epsilon", () => {
    const perturbed = perturb(ORIGINAL_INPUT, 0.15);
    perturbed.forEach((x, i) => {
      expect(Math.abs(x - ORIGINAL_INPUT[i])).toBeLessThanOrEqual(0.15 + 1e-10);
    });
  });

  it("flips the classification at epsilon=0.15, even though no single pixel moved much", () => {
    const before = predict(ORIGINAL_INPUT);
    const after = predict(perturb(ORIGINAL_INPUT, 0.15));
    expect(before).toBeGreaterThan(0.5);
    expect(after).toBeLessThan(0.5);
  });

  it("matches the hand-computed confidence after perturbation at epsilon=0.15", () => {
    const after = predict(perturb(ORIGINAL_INPUT, 0.15));
    expect(after).toBeCloseTo(1 / (1 + Math.exp(0.45)), 10);
  });
});

describe("EPSILON_CANDIDATES", () => {
  it("epsilon=0.1 lands exactly on the decision boundary, not past it", () => {
    const confidence = predict(perturb(ORIGINAL_INPUT, 0.1));
    expect(confidence).toBeCloseTo(0.5, 10);
  });

  it("0.15 is the smallest candidate that actually flips the classification below 0.5", () => {
    const flips = EPSILON_CANDIDATES.map((eps) => predict(perturb(ORIGINAL_INPUT, eps)) < 0.5);
    expect(flips).toEqual([false, false, true, true]);
    const firstFlip = EPSILON_CANDIDATES[flips.indexOf(true)];
    expect(firstFlip).toBe(0.15);
  });

  it("the perturbation's effect on the dot product scales with dimensionality, not just epsilon", () => {
    const eps = 0.1;
    const singleDimEffect = eps * Math.abs(WEIGHTS[0]);
    const before = WEIGHTS.reduce((s, w, i) => s + w * ORIGINAL_INPUT[i], BIAS);
    const after = WEIGHTS.reduce((s, w, i) => s + w * perturb(ORIGINAL_INPUT, eps)[i], BIAS);
    expect(before - after).toBeCloseTo(WEIGHTS.length * singleDimEffect, 10);
  });
});
