import { describe, it, expect } from "vitest";
import { step, output, runSequence, ssmMemory, attentionMemory, SEQUENCE, B, C } from "@/lib/math-core/state-space-models";

describe("step", () => {
  it("matches the hand-computed recurrence for every token in SEQUENCE", () => {
    const expected = [1, -0.5, 1.75, 1.375, 0.1875];
    let h = 0;
    for (let i = 0; i < SEQUENCE.length; i++) {
      h = step(h, SEQUENCE[i]);
      expect(h).toBeCloseTo(expected[i], 10);
    }
  });
});

describe("output", () => {
  it("scales the state by C", () => {
    expect(output(1)).toBeCloseTo(C * 1, 10);
    expect(output(-0.5)).toBeCloseTo(C * -0.5, 10);
  });
});

describe("runSequence", () => {
  it("matches the hand-computed states and outputs for the full sequence", () => {
    const { states, outputs } = runSequence();
    expect(states[0]).toBe(0);
    expect(states.slice(1)).toEqual([1, -0.5, 1.75, 1.375, 0.1875]);
    expect(outputs).toEqual([2, -1, 3.5, 2.75, 0.375]);
  });

  it("the smallest-magnitude state occurs at the last timestep", () => {
    const { states } = runSequence();
    const magnitudes = states.slice(1).map(Math.abs);
    const minIndex = magnitudes.indexOf(Math.min(...magnitudes));
    expect(minIndex).toBe(SEQUENCE.length - 1);
  });

  it("with A=1 (no decay), the state is just the running sum of every input", () => {
    const { states } = runSequence(SEQUENCE, 1, B, C);
    expect(states[states.length - 1]).toBeCloseTo(SEQUENCE.reduce((a, b) => a + b, 0), 10);
  });
});

describe("memory footprints", () => {
  it("SSM memory stays constant as the sequence grows; attention memory grows linearly", () => {
    expect(ssmMemory()).toBe(1);
    expect(attentionMemory(10)).toBe(10);
    expect(attentionMemory(10000)).toBe(10000);
  });
});
