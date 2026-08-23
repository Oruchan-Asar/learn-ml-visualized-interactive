import { describe, it, expect } from "vitest";
import {
  THETA,
  Q0,
  K0,
  dot2D,
  rotate2D,
  ropeVector,
  plainDot,
  ropeDot,
  POSITIONS,
  ABSOLUTE_STARTS,
} from "@/lib/math-core/rotary-position-embedding-rope";

describe("rotate2D", () => {
  it("leaves a vector unchanged at angle 0", () => {
    expect(rotate2D(Q0, 0)).toEqual([Q0[0], Q0[1]]);
  });

  it("maps (x, y) to (-y, x) at a quarter turn (π/2)", () => {
    const [x, y] = rotate2D(Q0, THETA);
    expect(x).toBeCloseTo(-Q0[1], 10);
    expect(y).toBeCloseTo(Q0[0], 10);
  });

  it("returns to the start after a full turn (4 steps of π/2)", () => {
    const [x, y] = rotate2D(Q0, 4 * THETA);
    expect(x).toBeCloseTo(Q0[0], 9);
    expect(y).toBeCloseTo(Q0[1], 9);
  });
});

describe("plainDot", () => {
  it("matches the hand-computed dot product of Q0 and K0", () => {
    expect(plainDot(Q0, K0)).toBeCloseTo(1.0, 10);
  });
});

describe("ropeDot", () => {
  it("matches the hand-computed value at distance 0 — equal to the plain dot product", () => {
    expect(ropeDot(0, 0)).toBeCloseTo(plainDot(Q0, K0), 10);
    expect(ropeDot(2, 2)).toBeCloseTo(plainDot(Q0, K0), 10);
  });

  it("matches the hand-computed value at relative distance 1: -0.75", () => {
    expect(ropeDot(0, 1)).toBeCloseTo(-0.75, 10);
  });

  it("matches the hand-computed value at relative distance 2: -1.0", () => {
    expect(ropeDot(0, 2)).toBeCloseTo(-1.0, 10);
  });

  it("depends only on the relative offset (posK - posQ), not on absolute position", () => {
    const distanceOne = ABSOLUTE_STARTS.map((start) => ropeDot(start, start + 1));
    for (const v of distanceOne) expect(v).toBeCloseTo(distanceOne[0], 9);

    const distanceTwo = ABSOLUTE_STARTS.map((start) => ropeDot(start, start + 2));
    for (const v of distanceTwo) expect(v).toBeCloseTo(distanceTwo[0], 9);
  });

  it("is periodic with period 4 (a full turn of θ = π/2), for both absolute positions", () => {
    for (const pos of POSITIONS) {
      expect(ropeDot(pos, pos + 4)).toBeCloseTo(ropeDot(pos, pos), 9);
    }
  });

  it("differs from the plain, position-blind dot product once the two positions differ", () => {
    expect(ropeDot(0, 1)).not.toBeCloseTo(plainDot(Q0, K0), 3);
  });
});

describe("ropeVector", () => {
  it("agrees with a direct rotate2D call", () => {
    expect(ropeVector(Q0, 3)).toEqual(rotate2D(Q0, 3 * THETA));
  });

  it("preserves vector length (rotation is distance-preserving)", () => {
    const before = Math.sqrt(dot2D(Q0, Q0));
    const after = Math.sqrt(dot2D(ropeVector(Q0, 7), ropeVector(Q0, 7)));
    expect(after).toBeCloseTo(before, 10);
  });
});
