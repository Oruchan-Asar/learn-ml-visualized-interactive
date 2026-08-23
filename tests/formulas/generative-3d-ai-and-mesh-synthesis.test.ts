import { describe, it, expect } from "vitest";
import {
  distance,
  chamferDistance,
  refinementTrace,
  refinementAt,
  chamferAt,
  findZeroCrossing,
  TARGET_SHAPE,
  COARSE_GUESS,
  REFINEMENT_STEPS,
  DENSITY_PROFILE,
  CHECKPOINT_TARGET_CHAMFER,
} from "@/lib/math-core/generative-3d-ai-and-mesh-synthesis";

describe("distance", () => {
  it("is the plain Euclidean distance", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe("chamferDistance — hand-worked refinement trace", () => {
  it("the collapsed coarse guess scores 2*sqrt(2) — every point is sqrt(2) from every corner", () => {
    expect(chamferDistance(COARSE_GUESS, TARGET_SHAPE)).toBeCloseTo(2 * Math.sqrt(2), 10);
  });

  it("the halfway step scores sqrt(2), exactly half the coarse score", () => {
    expect(chamferDistance(REFINEMENT_STEPS[1], TARGET_SHAPE)).toBeCloseTo(Math.sqrt(2), 10);
  });

  it("an exact match scores 0", () => {
    expect(chamferDistance(TARGET_SHAPE, TARGET_SHAPE)).toBe(0);
  });

  it("is symmetric", () => {
    expect(chamferDistance(REFINEMENT_STEPS[1], TARGET_SHAPE)).toBeCloseTo(
      chamferDistance(TARGET_SHAPE, REFINEMENT_STEPS[1]),
      10,
    );
  });
});

describe("refinementTrace", () => {
  it("strictly decreases across the 3 refinement steps", () => {
    const trace = refinementTrace();
    expect(trace).toHaveLength(3);
    expect(trace[0]).toBeGreaterThan(trace[1]);
    expect(trace[1]).toBeGreaterThan(trace[2]);
    expect(trace[2]).toBe(0);
  });
});

describe("refinementAt / chamferAt — continuous t in [0,1]", () => {
  it("t=0 reproduces the coarse guess, t=1 the exact target", () => {
    expect(refinementAt(0)).toEqual(COARSE_GUESS);
    expect(refinementAt(1)).toEqual(TARGET_SHAPE);
  });

  it("t=0.5 reproduces the hand-designed halfway step exactly", () => {
    expect(refinementAt(0.5)).toEqual(REFINEMENT_STEPS[1]);
  });

  it("chamfer error falls off linearly as 2*(1-t)*sqrt(2)", () => {
    expect(chamferAt(0)).toBeCloseTo(2 * Math.sqrt(2), 10);
    expect(chamferAt(0.5)).toBeCloseTo(Math.sqrt(2), 10);
    expect(chamferAt(1)).toBeCloseTo(0, 10);
  });

  it("checkpoint target chamfer (0.5) is reached around t ~= 0.823", () => {
    expect(chamferAt(0.823223)).toBeCloseTo(CHECKPOINT_TARGET_CHAMFER, 2);
  });
});

describe("findZeroCrossing — hand-worked on the density profile", () => {
  it("finds the surface crossing between x=1 (d=-0.2) and x=2 (d=0.6) at x=1.25", () => {
    const [, s1, s2] = DENSITY_PROFILE;
    expect(findZeroCrossing(s1.x, s1.d, s2.x, s2.d)).toBeCloseTo(1.25, 10);
  });

  it("extrapolates outside the segment for same-sign samples (not a real crossing)", () => {
    const [s0, s1] = DENSITY_PROFILE;
    // d0 and d1 are both negative here, so the "crossing" the linear formula finds falls at t=1.25 —
    // outside [x0, x1], which is the tell that there's no real surface crossing between these samples.
    expect(findZeroCrossing(s0.x, s0.d, s1.x, s1.d)).toBeCloseTo(1.25, 10);
  });
});
