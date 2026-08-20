import { describe, it, expect } from "vitest";
import {
  ACTIVATIONS,
  OUTPUT_WEIGHTS,
  TRUE_OUTPUT,
  sampleDropout,
  sampleAtIndex,
  expectedActiveCount,
  NUM_NEURONS,
  TARGET_ACTIVE_COUNT,
} from "@/lib/math-core/dropout";

function seededRng(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("TRUE_OUTPUT is the plain dot product of activations and weights", () => {
  it("matches a direct hand recomputation", () => {
    const recomputed = ACTIVATIONS.reduce((sum, h, i) => sum + OUTPUT_WEIGHTS[i] * h, 0);
    expect(TRUE_OUTPUT).toBeCloseTo(recomputed, 10);
  });
});

describe("expectedActiveCount is exactly N*(1-p)", () => {
  it("is 8 at p=0 and 0 at p=1", () => {
    expect(expectedActiveCount(0)).toBe(NUM_NEURONS);
    expect(expectedActiveCount(1)).toBe(0);
  });

  it("reaches the target active count (3) at p = 1 - 3/8 = 0.625", () => {
    expect(expectedActiveCount(0.625)).toBeCloseTo(TARGET_ACTIVE_COUNT, 10);
  });
});

describe("inverted dropout is unbiased: the average sample output converges to TRUE_OUTPUT", () => {
  it("over 200,000 samples at p=0.5, the mean output is within 1% of TRUE_OUTPUT", () => {
    const rng = seededRng(4242);
    let total = 0;
    const n = 200000;
    for (let i = 0; i < n; i++) total += sampleDropout(0.5, rng).output;
    const mean = total / n;
    expect(Math.abs(mean - TRUE_OUTPUT)).toBeLessThan(Math.abs(TRUE_OUTPUT) * 0.01 + 0.01);
  });

  it("this holds at a different dropout rate too (p=0.3)", () => {
    const rng = seededRng(99999);
    let total = 0;
    const n = 200000;
    for (let i = 0; i < n; i++) total += sampleDropout(0.3, rng).output;
    const mean = total / n;
    expect(Math.abs(mean - TRUE_OUTPUT)).toBeLessThan(Math.abs(TRUE_OUTPUT) * 0.01 + 0.01);
  });
});

describe("sampleAtIndex is deterministic — safe to call during server rendering and client hydration alike", () => {
  it("returns the exact same sample for the same (p, index) every time", () => {
    const a = sampleAtIndex(0.5, 3);
    const b = sampleAtIndex(0.5, 3);
    expect(a.output).toBe(b.output);
    expect(a.activeCount).toBe(b.activeCount);
  });

  it("different indices generally produce different samples", () => {
    const samples = Array.from({ length: 10 }, (_, i) => sampleAtIndex(0.5, i).output);
    const distinctValues = new Set(samples);
    expect(distinctValues.size).toBeGreaterThan(5);
  });
});

describe("a single dropout sample is genuinely noisy — not equal to TRUE_OUTPUT in general", () => {
  it("varies substantially from TRUE_OUTPUT across individual draws at p=0.5", () => {
    const rng = seededRng(7);
    const samples = Array.from({ length: 20 }, () => sampleDropout(0.5, rng).output);
    const anyFarFromTrue = samples.some((s) => Math.abs(s - TRUE_OUTPUT) > 0.3);
    expect(anyFarFromTrue).toBe(true);
  });
});
