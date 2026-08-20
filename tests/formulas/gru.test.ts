import { describe, it, expect } from "vitest";
import { gruStep, gruSequence, gruGradientProduct, sigmoid, WEIGHTS } from "@/lib/math-core/gru";
import { rnnGradientProduct, lstmGradientProduct } from "@/lib/math-core/vanishing-gradients-rnns-lstms";

describe("gru", () => {
  it("the update gate stays small and constant, biased toward keeping old state", () => {
    const step = gruStep(0);
    expect(step.z).toBeCloseTo(sigmoid(WEIGHTS.bz), 12);
    expect(step.z).toBeCloseTo(0.01798620996209156, 12);
  });

  it("the reset gate stays open, letting most of the old state into the candidate", () => {
    const step = gruStep(0);
    expect(step.r).toBeCloseTo(0.9820137900379085, 12);
  });

  it("hidden state builds up slowly and monotonically over 10 steps, never resetting", () => {
    const seq = gruSequence(10);
    const values = seq.map((s) => s.h);
    expect(values.every((v, i) => i === 0 || v > values[i - 1])).toBe(true);
    expect(values[values.length - 1]).toBeCloseTo(0.12844284132197858, 10);
  });

  it("the update gate is far more gradient-preserving over 10 steps than a typical LSTM forget gate", () => {
    const seq = gruSequence(10);
    const gruGrad = gruGradientProduct(10, seq[0].z);
    const lstmGrad = lstmGradientProduct(10, 0.9);
    const rnnGrad = rnnGradientProduct(10, 0.9);
    expect(gruGrad).toBeCloseTo(0.8492944345008834, 10);
    expect(lstmGrad).toBeCloseTo(0.3874204890000001, 10);
    expect(rnnGrad).toBeCloseTo(2.860630983793514e-10, 15);
    expect(gruGrad).toBeGreaterThan(lstmGrad);
    expect(lstmGrad).toBeGreaterThan(rnnGrad);
  });
});
