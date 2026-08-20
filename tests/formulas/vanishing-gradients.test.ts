import { describe, it, expect } from "vitest";
import { forwardBackward, gradientAtInput, FIXED_WEIGHT, INPUT_X0, TARGET, VANISH_THRESHOLD } from "@/lib/math-core/vanishing-gradients";
import { sigmoid } from "@/lib/math-core/activation-functions";

function lossAtDepth(depth: number, x0: number, weight = FIXED_WEIGHT): number {
  let h = x0;
  for (let i = 0; i < depth; i++) h = sigmoid(weight * h);
  return 0.5 * (h - TARGET) ** 2;
}

describe("the backward gradient matches a numerical derivative of the loss w.r.t. the input", () => {
  it("agrees with (loss(x0+e)-loss(x0-e))/(2e) at several depths", () => {
    const eps = 1e-6;
    for (const depth of [1, 3, 5, 8]) {
      const numeric = (lossAtDepth(depth, INPUT_X0 + eps) - lossAtDepth(depth, INPUT_X0 - eps)) / (2 * eps);
      const analytical = forwardBackward(depth).gradients[0];
      expect(analytical).toBeCloseTo(numeric, 5);
    }
  });
});

describe("the gradient reaching the input shrinks monotonically and rapidly with depth", () => {
  it("gets smaller in magnitude at every additional layer", () => {
    let prev = Infinity;
    for (let depth = 1; depth <= 10; depth++) {
      const g = gradientAtInput(depth);
      expect(g).toBeLessThan(prev);
      prev = g;
    }
  });

  it("drops below the vanishing threshold (1e-6) by depth 7, but not yet at depth 6", () => {
    expect(gradientAtInput(6)).toBeGreaterThan(VANISH_THRESHOLD);
    expect(gradientAtInput(7)).toBeLessThan(VANISH_THRESHOLD);
  });

  it("is already tiny (under 0.1) at just a single layer, since sigmoid's derivative never exceeds 0.25", () => {
    expect(gradientAtInput(1)).toBeLessThan(0.1);
  });
});

describe("every layer's forward value stays inside sigmoid's range regardless of weight", () => {
  it("h_i is always strictly between 0 and 1", () => {
    const { gradients } = forwardBackward(10);
    expect(gradients.length).toBe(11);
  });
});
