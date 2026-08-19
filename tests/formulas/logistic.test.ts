import { describe, it, expect } from "vitest";
import { sigmoid, sigmoidDerivative, logisticScore, logisticScoreDerivative } from "@/lib/math-core/logistic";

describe("sigmoid", () => {
  it("is exactly 0.5 at z=0", () => {
    expect(sigmoid(0)).toBeCloseTo(0.5);
  });

  it("saturates toward 1 for large positive z and toward 0 for large negative z", () => {
    expect(sigmoid(10)).toBeGreaterThan(0.9999);
    expect(sigmoid(-10)).toBeLessThan(0.0001);
  });

  it("is symmetric: sigmoid(-z) = 1 - sigmoid(z)", () => {
    for (const z of [0.5, 2, 5]) {
      expect(sigmoid(-z)).toBeCloseTo(1 - sigmoid(z));
    }
  });
});

describe("sigmoidDerivative", () => {
  it("peaks at z=0, at exactly 0.25", () => {
    expect(sigmoidDerivative(0)).toBeCloseTo(0.25);
  });

  it("is smaller away from z=0 than at z=0", () => {
    expect(sigmoidDerivative(3)).toBeLessThan(sigmoidDerivative(0));
    expect(sigmoidDerivative(-3)).toBeLessThan(sigmoidDerivative(0));
  });
});

describe("logisticScore and its chain-rule derivative", () => {
  it("is exactly 0.5 at the decision boundary x = -b/w, for several (w,b)", () => {
    for (const [w, b] of [
      [1, -5],
      [0.5, 2],
      [2, -1],
    ]) {
      const boundary = -b / w;
      expect(logisticScore(w, b, boundary)).toBeCloseTo(0.5);
    }
  });

  it("agrees with central-difference numerical differentiation (the chain rule, checked numerically)", () => {
    const eps = 1e-4;
    for (const [w, b, x] of [
      [1, -5, 3],
      [0.5, 2, 1],
      [2, -1, 4],
    ]) {
      const numeric = (logisticScore(w, b, x + eps) - logisticScore(w, b, x - eps)) / (2 * eps);
      expect(logisticScoreDerivative(w, b, x)).toBeCloseTo(numeric, 3);
    }
  });

  it("hits the checkpoint's target: boundary at x=5 whenever b = -5w, for any w", () => {
    for (const w of [0.2, 1, 1.5, 3]) {
      const b = -5 * w;
      expect(logisticScore(w, b, 5)).toBeCloseTo(0.5);
    }
  });
});
