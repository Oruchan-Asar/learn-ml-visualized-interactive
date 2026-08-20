import { describe, it, expect } from "vitest";
import { forward, lossAt, gradientAt, fullBackprop, DEFAULT_W11 } from "@/lib/math-core/backpropagation";

describe("forward pass at the default w11=0.5", () => {
  it("z1 is exactly 0 (0.5*1 + -0.3*2 + 0.1 = 0), so h1 = sigmoid(0) = 0.5", () => {
    const { z1, h1 } = forward(DEFAULT_W11);
    expect(z1).toBeCloseTo(0, 10);
    expect(h1).toBeCloseTo(0.5, 10);
  });

  it("matches the full hand-derived forward values", () => {
    const state = forward(DEFAULT_W11);
    expect(state.z2).toBeCloseTo(0.8, 10);
    expect(state.h2).toBeCloseTo(0.68997, 4);
    expect(state.zOut).toBeCloseTo(0.36003, 4);
    expect(state.y).toBeCloseTo(0.58905, 4);
    expect(state.loss).toBeCloseTo(0.17349, 4);
  });
});

describe("gradientAt matches a numerical derivative of the loss", () => {
  it("agrees with (loss(w+e)-loss(w-e))/(2e) across several w11 values", () => {
    const eps = 1e-6;
    for (const w of [-1, -0.5, 0, 0.5, 1, 1.5]) {
      const numeric = (lossAt(w + eps) - lossAt(w - eps)) / (2 * eps);
      expect(gradientAt(w)).toBeCloseTo(numeric, 5);
    }
  });

  it("equals exactly 0.053472 at the default w11=0.5, matching the hand-derived chain", () => {
    expect(gradientAt(DEFAULT_W11)).toBeCloseTo(0.053472, 5);
  });
});

describe("fullBackprop reproduces every one of the 9 hand-derived gradients", () => {
  it("matches the full worked-example breakdown at w11=0.5", () => {
    const g = fullBackprop(DEFAULT_W11);
    expect(g.dW11).toBeCloseTo(0.053472, 5);
    expect(g.dW12).toBeCloseTo(0.106943, 5);
    expect(g.dB1).toBeCloseTo(0.053472, 5);
    expect(g.dW21).toBeCloseTo(-0.030502, 5);
    expect(g.dW22).toBeCloseTo(-0.061003, 5);
    expect(g.dB2).toBeCloseTo(-0.030502, 5);
    expect(g.dV1).toBeCloseTo(0.071295, 5);
    expect(g.dV2).toBeCloseTo(0.098384, 5);
    expect(g.dC).toBeCloseTo(0.142591, 5);
  });

  it("every one of the 9 gradients matches its own numerical (finite-difference) check", () => {
    const eps = 1e-6;
    const base = { w12: -0.3, b1: 0.1, w21: -0.2, w22: 0.4, b2: 0.2, v1: 1.5, v2: -1.0, c: 0.3 };
    function lossWith(overrides: Partial<typeof base> & { w11: number }): number {
      const { w11, w12 = base.w12, b1 = base.b1, w21 = base.w21, w22 = base.w22, b2 = base.b2, v1 = base.v1, v2 = base.v2, c = base.c } = overrides;
      const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
      const z1 = w11 * 1 + w12 * 2 + b1;
      const h1 = sigmoid(z1);
      const z2 = w21 * 1 + w22 * 2 + b2;
      const h2 = sigmoid(z2);
      const zOut = v1 * h1 + v2 * h2 + c;
      const y = sigmoid(zOut);
      return 0.5 * y ** 2;
    }
    const g = fullBackprop(DEFAULT_W11);
    const checks: [number, () => number][] = [
      [g.dW11, () => (lossWith({ w11: DEFAULT_W11 + eps }) - lossWith({ w11: DEFAULT_W11 - eps })) / (2 * eps)],
      [g.dW12, () => (lossWith({ w11: DEFAULT_W11, w12: base.w12 + eps }) - lossWith({ w11: DEFAULT_W11, w12: base.w12 - eps })) / (2 * eps)],
      [g.dB1, () => (lossWith({ w11: DEFAULT_W11, b1: base.b1 + eps }) - lossWith({ w11: DEFAULT_W11, b1: base.b1 - eps })) / (2 * eps)],
      [g.dV1, () => (lossWith({ w11: DEFAULT_W11, v1: base.v1 + eps }) - lossWith({ w11: DEFAULT_W11, v1: base.v1 - eps })) / (2 * eps)],
      [g.dC, () => (lossWith({ w11: DEFAULT_W11, c: base.c + eps }) - lossWith({ w11: DEFAULT_W11, c: base.c - eps })) / (2 * eps)],
    ];
    for (const [analytical, numericFn] of checks) {
      expect(analytical).toBeCloseTo(numericFn(), 4);
    }
  });
});
