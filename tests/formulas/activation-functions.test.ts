import { describe, it, expect } from "vitest";
import {
  stepFn,
  sigmoid,
  tanhFn,
  relu,
  sigmoidDerivative,
  reluDerivative,
  TARGET_X,
  TARGET_SIGMOID_VALUE,
} from "@/lib/math-core/activation-functions";

describe("step function", () => {
  it("is 0 for negative x and 1 for x >= 0, with a hard jump at 0", () => {
    expect(stepFn(-0.001)).toBe(0);
    expect(stepFn(0)).toBe(1);
    expect(stepFn(5)).toBe(1);
  });
});

describe("sigmoid, hand-derived", () => {
  it("is exactly 0.5 at x=0", () => {
    expect(sigmoid(0)).toBeCloseTo(0.5, 10);
  });

  it("matches 1/(1+e^-2) ≈ 0.8808 at x=2", () => {
    expect(sigmoid(2)).toBeCloseTo(1 / (1 + Math.exp(-2)), 10);
    expect(sigmoid(2)).toBeCloseTo(0.8808, 3);
  });

  it("saturates toward 0 and 1 at the domain edges", () => {
    expect(sigmoid(-4)).toBeLessThan(0.02);
    expect(sigmoid(4)).toBeGreaterThan(0.98);
  });
});

describe("tanh, hand-derived", () => {
  it("is exactly 0 at x=0 and saturates toward -1/1", () => {
    expect(tanhFn(0)).toBeCloseTo(0, 10);
    expect(tanhFn(-4)).toBeLessThan(-0.99);
    expect(tanhFn(4)).toBeGreaterThan(0.99);
  });

  it("is exactly 2*sigmoid(2x) - 1 — the two functions are the same curve, rescaled", () => {
    for (const x of [-2, -0.5, 0, 1, 3]) {
      expect(tanhFn(x)).toBeCloseTo(2 * sigmoid(2 * x) - 1, 10);
    }
  });
});

describe("ReLU, hand-derived", () => {
  it("is exactly 0 for any negative input and the identity for positive input", () => {
    expect(relu(-3)).toBe(0);
    expect(relu(0)).toBe(0);
    expect(relu(3)).toBe(3);
  });
});

describe("derivatives", () => {
  it("sigmoid's derivative peaks at 0.25 exactly at x=0", () => {
    expect(sigmoidDerivative(0)).toBeCloseTo(0.25, 10);
  });

  it("ReLU's derivative is a clean 0/1 step, undefined kink aside", () => {
    expect(reluDerivative(-1)).toBe(0);
    expect(reluDerivative(1)).toBe(1);
  });
});

describe("TARGET_X solves sigmoid(x) = 0.9 exactly", () => {
  it("sigmoid(TARGET_X) reproduces the target value", () => {
    expect(sigmoid(TARGET_X)).toBeCloseTo(TARGET_SIGMOID_VALUE, 10);
  });

  it("TARGET_X is approximately ln(9) ≈ 2.197", () => {
    expect(TARGET_X).toBeCloseTo(Math.log(9), 10);
  });
});
