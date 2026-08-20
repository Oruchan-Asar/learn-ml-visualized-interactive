import { describe, it, expect } from "vitest";
import { transferTrace, fromScratchTrace, mse, PRETRAINED_W } from "@/lib/math-core/transfer-learning-and-fine-tuning";

describe("transfer-learning-and-fine-tuning", () => {
  it("fine-tuning just the intercept converges in one step at its ideal learning rate", () => {
    const trace = transferTrace(0.5, 1);
    expect(trace[1]).toBe(5);
    expect(mse(PRETRAINED_W, trace[1])).toBe(0);
  });

  it("the same learning rate that's ideal for fine-tuning diverges catastrophically for joint from-scratch training", () => {
    const trace = fromScratchTrace(0.5, 3);
    expect(Math.abs(trace[3].w)).toBeGreaterThan(300);
    expect(Math.abs(trace[3].b)).toBeGreaterThan(100);
  });

  it("from-scratch training, even at a safe learning rate, is still far from converged after 5 steps", () => {
    const trace = fromScratchTrace(0.1, 5);
    const final = trace[5];
    expect(mse(final.w, final.b)).toBeCloseTo(1.7973641216, 8);
  });

  it("from-scratch training remains meaningfully off target even after 20 steps — 20x the transfer budget", () => {
    const trace = fromScratchTrace(0.1, 20);
    const final = trace[20];
    expect(mse(final.w, final.b)).toBeCloseTo(0.6305304397236896, 8);
    expect(mse(final.w, final.b)).toBeGreaterThan(mse(PRETRAINED_W, transferTrace(0.5, 1)[1]));
  });
});
