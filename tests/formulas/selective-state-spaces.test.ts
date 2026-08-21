import { describe, it, expect } from "vitest";
import { fixedStep, isSignal, selectiveStep, runBoth, SEQUENCE } from "@/lib/math-core/selective-state-spaces";

describe("isSignal", () => {
  it("is true for nonzero tokens, false for exactly zero", () => {
    expect(isSignal(5)).toBe(true);
    expect(isSignal(-3)).toBe(true);
    expect(isSignal(0)).toBe(false);
  });
});

describe("selectiveStep", () => {
  it("freezes the state exactly on filler", () => {
    expect(selectiveStep(5, 0)).toBe(5);
    expect(selectiveStep(-3, 0)).toBe(-3);
  });

  it("overwrites the state completely on signal, ignoring the previous state", () => {
    expect(selectiveStep(5, -3)).toBe(-3);
    expect(selectiveStep(999, 5)).toBe(5);
  });
});

describe("runBoth", () => {
  it("matches the hand-computed fixed-model trace exactly", () => {
    const { fixed } = runBoth();
    expect(fixed.slice(1)).toEqual([5, 2.5, 1.25, 0.625, -2.6875, -1.34375, -0.671875]);
  });

  it("matches the hand-computed selective-model trace exactly", () => {
    const { selective } = runBoth();
    expect(selective.slice(1)).toEqual([5, 5, 5, 5, -3, -3, -3]);
  });

  it("the selective model perfectly preserves the last signal through every run of filler", () => {
    const { selective } = runBoth();
    // timesteps 2,3,4 (all filler, following the first signal) hold the first signal's exact value
    expect(selective[2]).toBe(5);
    expect(selective[3]).toBe(5);
    expect(selective[4]).toBe(5);
    // timesteps 6,7 (filler following the second signal) hold the second signal's exact value
    expect(selective[6]).toBe(-3);
    expect(selective[7]).toBe(-3);
  });

  it("the fixed model keeps decaying even on filler, so it never holds an exact past value", () => {
    const { fixed } = runBoth();
    expect(fixed[3]).not.toBe(5);
    expect(fixed[3]).toBeLessThan(5);
    expect(fixed[3]).toBeGreaterThan(0);
  });

  it("the two models diverge most at timestep 4, right before the second signal arrives", () => {
    const { fixed, selective } = runBoth();
    const diffs = fixed.map((f, i) => Math.abs(f - selective[i]));
    const maxIndex = diffs.indexOf(Math.max(...diffs));
    expect(maxIndex).toBe(4);
  });
});

describe("fixedStep", () => {
  it("matches the plain linear recurrence from the previous chapter", () => {
    expect(fixedStep(0, SEQUENCE[0])).toBeCloseTo(5, 10);
  });
});
