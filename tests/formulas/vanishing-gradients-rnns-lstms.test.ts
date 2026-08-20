import { describe, expect, it } from "vitest";
import {
  DEFAULT_WEIGHT,
  DEFAULT_STEPS,
  TARGET_RATIO,
  rnnGradientProduct,
  lstmGradientProduct,
} from "@/lib/math-core/vanishing-gradients-rnns-lstms";

describe("plain RNN gradient vanishes with sequence length", () => {
  it("matches the hand-derived values at wh = 0.9", () => {
    expect(rnnGradientProduct(1, 0.9)).toBeCloseTo(1, 6);
    expect(rnnGradientProduct(2, 0.9)).toBeCloseTo(0.1156, 3);
    expect(rnnGradientProduct(10, 0.9)).toBeCloseTo(2.861e-10, 12);
  });

  it("shrinks by roughly an order of magnitude with each additional timestep", () => {
    const g5 = Math.abs(rnnGradientProduct(5, 0.9));
    const g10 = Math.abs(rnnGradientProduct(10, 0.9));
    expect(g10).toBeLessThan(g5 / 1000);
  });
});

describe("LSTM cell-state gradient decays far more slowly", () => {
  it("matches forget_gate^(steps-1) exactly", () => {
    expect(lstmGradientProduct(1, 0.9)).toBeCloseTo(1, 10);
    expect(lstmGradientProduct(10, 0.9)).toBeCloseTo(Math.pow(0.9, 9), 10);
  });

  it("at 20 steps, the LSTM's gradient is still non-negligible while the RNN's has vanished", () => {
    const rnn = Math.abs(rnnGradientProduct(20, DEFAULT_WEIGHT));
    const lstm = lstmGradientProduct(20, DEFAULT_WEIGHT);
    expect(lstm).toBeGreaterThan(0.1);
    expect(rnn).toBeLessThan(1e-15);
  });
});

describe("the ratio between the two crosses the target threshold at a specific, non-trivial step count", () => {
  it("at the default step count, the ratio has not yet reached the target", () => {
    const rnn = Math.abs(rnnGradientProduct(DEFAULT_STEPS, DEFAULT_WEIGHT));
    const lstm = lstmGradientProduct(DEFAULT_STEPS, DEFAULT_WEIGHT);
    expect(lstm / rnn).toBeLessThan(TARGET_RATIO);
  });

  it("by step 7, the ratio exceeds the target", () => {
    const rnn = Math.abs(rnnGradientProduct(7, DEFAULT_WEIGHT));
    const lstm = lstmGradientProduct(7, DEFAULT_WEIGHT);
    expect(lstm / rnn).toBeGreaterThan(TARGET_RATIO);
  });

  it("one fewer step (6) has not yet crossed the target — the threshold is meaningfully placed", () => {
    const rnn = Math.abs(rnnGradientProduct(6, DEFAULT_WEIGHT));
    const lstm = lstmGradientProduct(6, DEFAULT_WEIGHT);
    expect(lstm / rnn).toBeLessThan(TARGET_RATIO);
  });
});
