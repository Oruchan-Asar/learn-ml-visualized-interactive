import { describe, it, expect } from "vitest";
import {
  step,
  forward,
  countCorrect,
  XOR_POINTS,
  DEFAULT_OUTPUT_BIAS,
  TARGET_OUTPUT_BIAS,
  TARGET_CORRECT_COUNT,
} from "@/lib/math-core/multi-layer-perceptrons";

describe("step", () => {
  it("is 0 strictly below zero and 1 at/above zero", () => {
    expect(step(-0.5)).toBe(0);
    expect(step(-0.0001)).toBe(0);
    expect(step(0)).toBe(1);
    expect(step(0.5)).toBe(1);
  });
});

describe("hidden layer acts like OR and NAND", () => {
  it("hidden neuron A fires like OR(x1, x2)", () => {
    expect(forward(0, 0, 0).hA).toBe(0);
    expect(forward(0, 1, 0).hA).toBe(1);
    expect(forward(1, 0, 0).hA).toBe(1);
    expect(forward(1, 1, 0).hA).toBe(1);
  });

  it("hidden neuron B fires like NAND(x1, x2)", () => {
    expect(forward(0, 0, 0).hB).toBe(1);
    expect(forward(0, 1, 0).hB).toBe(1);
    expect(forward(1, 0, 0).hB).toBe(1);
    expect(forward(1, 1, 0).hB).toBe(0);
  });
});

describe("countCorrect at the default (wrong) output bias", () => {
  it("gets exactly 2 of 4 XOR rows right at bias = 0 (behaves like plain OR(hA, hB))", () => {
    expect(countCorrect(DEFAULT_OUTPUT_BIAS)).toBe(2);
  });

  it("(0,0) and (1,1) are the two rows it gets wrong at bias = 0", () => {
    expect(forward(0, 0, DEFAULT_OUTPUT_BIAS).y).toBe(1); // target 0 — wrong
    expect(forward(1, 1, DEFAULT_OUTPUT_BIAS).y).toBe(1); // target 0 — wrong
    expect(forward(0, 1, DEFAULT_OUTPUT_BIAS).y).toBe(1); // target 1 — right
    expect(forward(1, 0, DEFAULT_OUTPUT_BIAS).y).toBe(1); // target 1 — right
  });
});

describe("countCorrect at the AND-gate bias solves XOR exactly", () => {
  it("gets all 4 rows right at bias = -1.5", () => {
    expect(countCorrect(TARGET_OUTPUT_BIAS)).toBe(TARGET_CORRECT_COUNT);
    for (const p of XOR_POINTS) {
      expect(forward(p.x1, p.x2, TARGET_OUTPUT_BIAS).y).toBe(p.target);
    }
  });

  it("the solved region is [-2, -1) — just outside it, at least one row flips wrong", () => {
    expect(countCorrect(-2)).toBe(4);
    expect(countCorrect(-1.99)).toBe(4);
    expect(countCorrect(-1)).toBeLessThan(4); // boundary excluded: (0,0) and (1,1) flip back to 1
    expect(countCorrect(-2.01)).toBeLessThan(4); // just past the other edge, (0,1)/(1,0) flip to 0
  });
});
