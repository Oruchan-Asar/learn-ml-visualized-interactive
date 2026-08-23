import { describe, it, expect } from "vitest";
import {
  l2CoupledDecay,
  decoupledDecay,
  LR,
  W1,
  W2,
  V1,
  V2,
  SGD_EQUIVALENT_V,
  DESTRUCTIVE_FRACTION,
  SAFE_FRACTION,
} from "@/lib/math-core/weight-decay-vs-l2";

describe("for plain SGD (v = 1), coupled L2 and decoupled decay agree exactly", () => {
  it("l2CoupledDecay(w, 1, lambda) equals decoupledDecay(w, lambda)", () => {
    for (const lambda of [0, 0.2, 0.5, 1]) {
      expect(l2CoupledDecay(W1, SGD_EQUIVALENT_V, lambda)).toBeCloseTo(decoupledDecay(W1, lambda), 6);
    }
  });

  it("hand computation: lambda = 0.5, v = 1 gives decay 0.05 (LR * lambda * w)", () => {
    expect(l2CoupledDecay(1, SGD_EQUIVALENT_V, 0.5)).toBeCloseTo(0.1 * 0.5 * 1, 6);
    expect(decoupledDecay(1, 0.5)).toBeCloseTo(0.05, 6);
  });
});

describe("once an adaptive optimizer's per-parameter history diverges, the two formulas diverge too", () => {
  it("w1 (rarely updated, small v) gets nearly the full coupled decay lambda*w", () => {
    // sqrt(V1) = 0.1, so LR*lambda*w1/(sqrt(V1)+eps) ~= lambda*w1
    expect(l2CoupledDecay(W1, V1, 0.5)).toBeCloseTo(0.5, 4);
  });

  it("w2 (frequently updated, large v) gets a much smaller coupled decay at the same lambda", () => {
    // sqrt(V2) = 2, so LR*lambda*w2/(sqrt(V2)+eps) = 0.05*lambda
    expect(l2CoupledDecay(W2, V2, 0.5)).toBeCloseTo(0.025, 4);
    expect(l2CoupledDecay(W2, V2, 0.5)).toBeLessThan(l2CoupledDecay(W1, V1, 0.5));
  });

  it("decoupled decay is identical for w1 and w2 at the same lambda, regardless of gradient history", () => {
    expect(decoupledDecay(W1, 0.5)).toBeCloseTo(decoupledDecay(W2, 0.5), 10);
  });
});

describe("a lambda that's destructive under coupled L2 is barely noticeable under decoupled decay", () => {
  it("lambda = 0.51 pushes coupled decay on w1 past the destructive fraction of w1", () => {
    expect(l2CoupledDecay(W1, V1, 0.51)).toBeGreaterThanOrEqual(DESTRUCTIVE_FRACTION * W1);
  });

  it("that same lambda keeps decoupled decay on w1 well under the safe fraction of w1", () => {
    expect(decoupledDecay(W1, 0.51)).toBeLessThan(SAFE_FRACTION * W1);
  });

  it("sanity: LR is the shared step size behind both formulas", () => {
    expect(LR).toBe(0.1);
  });
});
