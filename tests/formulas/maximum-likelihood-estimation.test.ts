import { describe, it, expect } from "vitest";
import { FLIPS, headsCount, mleEstimate, logLikelihood } from "@/lib/math-core/maximum-likelihood-estimation";

describe("headsCount", () => {
  it("4 heads out of 5 flips", () => {
    expect(headsCount(FLIPS)).toBe(4);
  });
});

describe("mleEstimate", () => {
  it("is exactly 0.8", () => {
    expect(mleEstimate(FLIPS)).toBeCloseTo(0.8, 10);
  });
});

describe("logLikelihood", () => {
  it("matches the hand-computed value at p=0.8: 4ln(0.8) + 1ln(0.2)", () => {
    const expected = 4 * Math.log(0.8) + 1 * Math.log(0.2);
    expect(logLikelihood(0.8, FLIPS)).toBeCloseTo(expected, 10);
    expect(logLikelihood(0.8, FLIPS)).toBeCloseTo(-2.502012, 5);
  });

  it("peaks at the MLE: p=0.8 beats every other candidate on a coarse grid", () => {
    const candidates = [0.2, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95];
    const best = candidates.reduce((a, b) => (logLikelihood(b, FLIPS) > logLikelihood(a, FLIPS) ? b : a));
    expect(best).toBeCloseTo(0.8, 10);
  });

  it("is symmetric-ish worse on both sides of 0.8", () => {
    const atMle = logLikelihood(0.8, FLIPS);
    expect(logLikelihood(0.6, FLIPS)).toBeLessThan(atMle);
    expect(logLikelihood(0.95, FLIPS)).toBeLessThan(atMle);
  });
});
