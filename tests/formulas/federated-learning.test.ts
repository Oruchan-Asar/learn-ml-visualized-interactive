import { describe, it, expect } from "vitest";
import {
  DEVICES,
  localGradient,
  federatedAverageGradient,
  federatedStep,
  runFederatedRounds,
  pooledMean,
} from "@/lib/math-core/federated-learning";

describe("localGradient", () => {
  it("matches hand-worked local gradients at theta=0", () => {
    expect(localGradient(0, [2, 3])).toBe(-5);
    expect(localGradient(0, [8, 9, 10])).toBe(-18);
    expect(localGradient(0, [4])).toBe(-8);
    expect(localGradient(0, [6, 5])).toBe(-11);
  });

  it("is zero when theta already equals the local mean", () => {
    expect(localGradient(2.5, [2, 3])).toBeCloseTo(0, 10);
  });
});

describe("federatedAverageGradient", () => {
  it("matches the hand-worked weighted average at theta=0", () => {
    // weighted sum = -5*2 + -18*3 + -8*1 + -11*2 = -94, over totalN=8
    expect(federatedAverageGradient(0, DEVICES)).toBeCloseTo(-11.75, 10);
  });

  it("equals the gradient a fully centralized fit on the pooled data would compute", () => {
    const all = DEVICES.flatMap((d) => d.data);
    const centralized = (2 / all.length) * all.reduce((s, x) => s + (0 - x), 0);
    expect(federatedAverageGradient(0, DEVICES)).toBeCloseTo(centralized, 10);
  });

  it("is zero once theta reaches the pooled mean", () => {
    expect(federatedAverageGradient(pooledMean(DEVICES), DEVICES)).toBeCloseTo(0, 8);
  });
});

describe("federatedStep", () => {
  it("matches a hand-worked single step from theta=0", () => {
    expect(federatedStep(0, DEVICES, 0.1)).toBeCloseTo(1.175, 10);
  });
});

describe("pooledMean", () => {
  it("is the mean of every device's data pooled together", () => {
    expect(pooledMean(DEVICES)).toBeCloseTo(5.875, 10);
  });
});

describe("runFederatedRounds", () => {
  it("converges toward the pooled mean over many rounds", () => {
    const theta = runFederatedRounds(0, 200, DEVICES, 0.1);
    expect(theta).toBeCloseTo(pooledMean(DEVICES), 4);
  });

  it("running 0 rounds returns the starting theta unchanged", () => {
    expect(runFederatedRounds(3, 0, DEVICES)).toBe(3);
  });
});
