import { describe, it, expect } from "vitest";
import { K_FRANCE, K_GERMANY, V_PARIS, V_BERLIN, V_ROME, DELTA_FULL, outputFor, franceRomeScore, germanyBerlinScore } from "@/lib/math-core/model-editing-rome-memit";

describe("original weights", () => {
  it("map each key to its original value before any edit", () => {
    expect(outputFor(0, K_FRANCE)).toEqual(V_PARIS);
    expect(outputFor(0, K_GERMANY)).toEqual(V_BERLIN);
  });
});

describe("DELTA_FULL", () => {
  it("is the hand-computed rank-1 update", () => {
    expect(DELTA_FULL.flat().map((x) => Math.abs(x) === 0 ? 0 : x)).toEqual([-2, 0, 3, 0]);
  });
});

describe("editedWeights", () => {
  it("at full strength, hits the new target value exactly", () => {
    expect(outputFor(1, K_FRANCE)).toEqual(V_ROME);
  });

  it("never moves the orthogonal Germany key, at any edit strength", () => {
    expect(outputFor(0, K_GERMANY)).toEqual(V_BERLIN);
    expect(outputFor(0.5, K_GERMANY)).toEqual(V_BERLIN);
    expect(outputFor(1, K_GERMANY)).toEqual(V_BERLIN);
  });
});

describe("franceRomeScore", () => {
  it("rises linearly from 0.25 to exactly 1.0", () => {
    expect(franceRomeScore(0)).toBeCloseTo(0.25, 10);
    expect(franceRomeScore(0.5)).toBeCloseTo(0.625, 10);
    expect(franceRomeScore(1)).toBeCloseTo(1, 10);
  });
});

describe("germanyBerlinScore", () => {
  it("stays pinned at exactly 1.0 regardless of the edit", () => {
    expect(germanyBerlinScore(0)).toBe(1);
    expect(germanyBerlinScore(1)).toBe(1);
  });
});
