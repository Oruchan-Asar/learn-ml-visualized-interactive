import { describe, expect, it } from "vitest";
import {
  SEQUENCE_A,
  SEQUENCE_B,
  DEFAULT_WH,
  TARGET_SEPARATION,
  runSequence,
  finalHidden,
} from "@/lib/math-core/recurrent-neural-networks";

describe("the RNN's hidden state depends on order, unlike sum-pooling", () => {
  it("matches the hand-derived trace for sequence A = [X, Y] at wh = 1", () => {
    const trace = runSequence(SEQUENCE_A, 1);
    expect(trace).toHaveLength(3); // h0, h1, h2
    expect(trace[0].h).toBe(0);
    expect(trace[1].h).toBeCloseTo(0.7616, 4);
    expect(trace[2].h).toBeCloseTo(-0.234, 3);
  });

  it("matches the hand-derived trace for sequence B = [Y, X] at wh = 1", () => {
    const trace = runSequence(SEQUENCE_B, 1);
    expect(trace[0].h).toBe(0);
    expect(trace[1].h).toBeCloseTo(-0.7616, 4);
    expect(trace[2].h).toBeCloseTo(0.234, 3);
  });

  it("the two sequences reach opposite-sign final hidden states at the default weight", () => {
    const hA = finalHidden(SEQUENCE_A, DEFAULT_WH);
    const hB = finalHidden(SEQUENCE_B, DEFAULT_WH);
    expect(Math.sign(hA)).not.toBe(Math.sign(hB));
  });

  it("at the default weight, the separation has not yet reached the target — real search is required", () => {
    const hA = finalHidden(SEQUENCE_A, DEFAULT_WH);
    const hB = finalHidden(SEQUENCE_B, DEFAULT_WH);
    expect(Math.abs(hA - hB)).toBeLessThan(TARGET_SEPARATION);
  });

  it("separation grows toward saturation as the recurrent weight increases", () => {
    const sep = (wh: number) => Math.abs(finalHidden(SEQUENCE_A, wh) - finalHidden(SEQUENCE_B, wh));
    expect(sep(4)).toBeGreaterThan(TARGET_SEPARATION);
    expect(sep(4)).toBeGreaterThan(sep(1));
  });

  it("there exists a pathological recurrent weight where the two sequences collapse back to the same state", () => {
    // Wx = [1, -1] makes h2B = -h2A identically, so they collapse only where h2A = 0.
    const badWh = 1 / Math.tanh(1);
    const hA = finalHidden(SEQUENCE_A, badWh);
    const hB = finalHidden(SEQUENCE_B, badWh);
    expect(Math.abs(hA)).toBeLessThan(1e-3);
    expect(Math.abs(hB)).toBeLessThan(1e-3);
  });
});
