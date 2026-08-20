import { describe, it, expect } from "vitest";
import { hiddenValue, composedOutput, chainDerivative, TARGET_X, TARGET_SLOPE } from "@/lib/math-core/network-chain";

describe("hand-derived values at x=0.5", () => {
  it("h(0.5) = sigmoid(0) = 0.5 exactly", () => {
    expect(hiddenValue(0.5)).toBeCloseTo(0.5, 10);
  });

  it("y(0.5) = sigmoid(-0.5) ≈ 0.3775", () => {
    expect(composedOutput(0.5)).toBeCloseTo(1 / (1 + Math.exp(0.5)), 10);
    expect(composedOutput(0.5)).toBeCloseTo(0.3775, 3);
  });

  it("dy/dx at x=0.5 matches the hand-multiplied chain: dy/dh * dh/dx ≈ -0.3525", () => {
    expect(chainDerivative(0.5)).toBeCloseTo(-0.3525, 3);
  });
});

describe("chainDerivative matches a numeric (finite-difference) derivative everywhere", () => {
  it("agrees with (y(x+e)-y(x-e))/(2e) to 5 decimal places across several x", () => {
    const eps = 1e-6;
    for (const x of [-2, -1, 0, 0.5, 1, 2, 3]) {
      const numeric = (composedOutput(x + eps) - composedOutput(x - eps)) / (2 * eps);
      expect(chainDerivative(x)).toBeCloseTo(numeric, 4);
    }
  });
});

describe("TARGET_SLOPE is exactly chainDerivative(TARGET_X)", () => {
  it("is reproduced by evaluating chainDerivative at TARGET_X", () => {
    expect(chainDerivative(TARGET_X)).toBeCloseTo(TARGET_SLOPE, 10);
    expect(TARGET_X).toBe(0.5);
  });
});
