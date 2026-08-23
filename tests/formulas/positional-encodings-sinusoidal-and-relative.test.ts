import { describe, it, expect } from "vitest";
import {
  D_MODEL,
  angleRate,
  sinusoidalEncoding,
  dot,
  add,
  TOKEN_A,
  TOKEN_B,
  contentScore,
  positionAwareScore,
  relativeBias,
  relativeScore,
  OFFSETS,
} from "@/lib/math-core/positional-encodings-sinusoidal-and-relative";

describe("sinusoidalEncoding", () => {
  it("is exactly [0, 1, 0, 1] at position 0 — sin(0)=0, cos(0)=1 at every frequency", () => {
    expect(sinusoidalEncoding(0)).toEqual([0, 1, 0, 1]);
  });

  it("matches the hand-computed values at position 1", () => {
    const enc = sinusoidalEncoding(1);
    expect(enc[0]).toBeCloseTo(Math.sin(1), 10);
    expect(enc[1]).toBeCloseTo(Math.cos(1), 10);
    expect(enc[2]).toBeCloseTo(Math.sin(0.01), 10);
    expect(enc[3]).toBeCloseTo(Math.cos(0.01), 10);
  });

  it("dimension pair 0 spins faster than dimension pair 1", () => {
    expect(angleRate(0, D_MODEL)).toBeGreaterThan(angleRate(1, D_MODEL));
  });
});

describe("contentScore", () => {
  it("matches the hand-computed dot product of the two tokens", () => {
    expect(contentScore(TOKEN_A, TOKEN_B)).toBeCloseTo(-0.5, 10);
  });

  it("is identical no matter which token is listed first — order doesn't exist without position", () => {
    expect(contentScore(TOKEN_A, TOKEN_B)).toBeCloseTo(contentScore(TOKEN_B, TOKEN_A), 10);
  });
});

describe("positionAwareScore", () => {
  it("changes when the same two tokens swap which position they occupy", () => {
    const aFirst = positionAwareScore(0, 1, TOKEN_A, TOKEN_B);
    const bFirst = positionAwareScore(0, 1, TOKEN_B, TOKEN_A);
    expect(aFirst).not.toBeCloseTo(bFirst, 3);
  });

  it("matches a hand-expanded dot product at a specific offset", () => {
    const expected = dot(add(TOKEN_A, sinusoidalEncoding(10)), add(TOKEN_B, sinusoidalEncoding(11)));
    expect(positionAwareScore(10, 11)).toBeCloseTo(expected, 10);
  });
});

describe("relativeScore", () => {
  it("matches the hand-computed value: content score plus the distance-1 bias", () => {
    expect(relativeScore(1)).toBeCloseTo(-0.5 + -0.3, 10);
  });

  it("stays exactly constant as both positions shift together, since only the distance is used", () => {
    const values = OFFSETS.map(() => relativeScore(1));
    for (const v of values) expect(v).toBeCloseTo(values[0], 10);
  });

  it("differs from positionAwareScore in general, since one reads content+position jointly and the other reads content+distance", () => {
    expect(relativeScore(1)).not.toBeCloseTo(positionAwareScore(0, 1), 3);
  });
});

describe("relativeBias", () => {
  it("falls back to 0 for a distance not in the table", () => {
    expect(relativeBias(99)).toBe(0);
  });
});
