import { describe, it, expect } from "vitest";
import { gridSearch, bestResult, descentTrace, loss, LEARNING_RATES } from "@/lib/math-core/hyperparameter-tuning";

describe("hyperparameter-tuning", () => {
  it("lr=0.5 lands exactly on the minimum in one step and stays there", () => {
    const trace = descentTrace(0.5);
    expect(trace[1]).toBe(3);
    expect(trace[trace.length - 1]).toBe(3);
    expect(loss(3)).toBe(0);
  });

  it("lr=1.0 oscillates forever without ever improving on the starting loss", () => {
    const trace = descentTrace(1.0);
    expect(trace[trace.length - 1]).toBe(0);
    expect(trace[trace.length - 2]).toBe(6);
    expect(loss(0)).toBe(9);
    expect(loss(trace[0])).toBe(loss(trace[trace.length - 1]));
  });

  it("lr=1.1 diverges, growing loss without bound", () => {
    const trace = descentTrace(1.1);
    expect(Math.abs(trace[4] - 3)).toBeGreaterThan(Math.abs(trace[1] - 3));
    expect(loss(trace[trace.length - 1])).toBeGreaterThan(10000);
  });

  it("lr=0.1 and lr=0.9 converge to the same final loss by symmetry around the ideal rate", () => {
    const results = gridSearch();
    const at = (lr: number) => results.find((r) => r.learningRate === lr)!;
    expect(at(0.1).finalLoss).toBeCloseTo(at(0.9).finalLoss, 10);
    expect(at(0.1).finalLoss).toBeCloseTo(0.0011963051962064115, 12);
  });

  it("grid search picks lr=0.5 as the best of the six candidates", () => {
    const results = gridSearch();
    expect(results).toHaveLength(LEARNING_RATES.length);
    const best = bestResult(results);
    expect(best.learningRate).toBe(0.5);
    expect(best.finalLoss).toBe(0);
  });

  it("too-small a learning rate leaves the loss far from converged after the same budget", () => {
    const results = gridSearch();
    const slow = results.find((r) => r.learningRate === 0.01)!;
    expect(slow.finalLoss).toBeCloseTo(4.0113036355585585, 8);
  });
});
