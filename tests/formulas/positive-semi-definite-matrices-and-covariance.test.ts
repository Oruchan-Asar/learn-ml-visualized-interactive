import { describe, it, expect } from "vitest";
import {
  DEVIATIONS,
  COVARIANCE,
  COVARIANCE_EIGENVALUES,
  MAX_VARIANCE_DIRECTION,
  MIN_VARIANCE_DIRECTION,
  INDEFINITE_MATRIX,
  CHECKPOINT_ANGLE,
  covarianceMatrix,
  quadraticForm,
  unitVectorAtAngle,
  isPSD,
} from "@/lib/math-core/positive-semi-definite-matrices-and-covariance";

describe("covarianceMatrix", () => {
  it("computes Var(x)=5, Var(y)=5, Cov(x,y)=3 for DEVIATIONS", () => {
    expect(covarianceMatrix(DEVIATIONS)).toEqual({ a: 5, b: 3, c: 3, d: 5 });
  });

  it("COVARIANCE matches the direct computation", () => {
    expect(COVARIANCE).toEqual({ a: 5, b: 3, c: 3, d: 5 });
  });
});

describe("quadraticForm on COVARIANCE (always non-negative — it's PSD)", () => {
  it("along the x-axis, equals Var(x) = 5", () => {
    expect(quadraticForm(COVARIANCE, { x: 1, y: 0 })).toBe(5);
  });

  it("along the max-variance direction (normalized), equals the top eigenvalue, 8", () => {
    const v = unitVectorAtAngle(45);
    expect(quadraticForm(COVARIANCE, v)).toBeCloseTo(8, 10);
  });

  it("along the min-variance direction (normalized), equals the bottom eigenvalue, 2", () => {
    const v = unitVectorAtAngle(135);
    expect(quadraticForm(COVARIANCE, v)).toBeCloseTo(2, 10);
  });

  it("stays non-negative at every 45-degree snap angle", () => {
    for (let deg = 0; deg < 360; deg += 45) {
      expect(quadraticForm(COVARIANCE, unitVectorAtAngle(deg))).toBeGreaterThanOrEqual(-1e-9);
    }
  });
});

describe("quadraticForm on INDEFINITE_MATRIX (dips negative — not PSD)", () => {
  it("along the x-axis is positive (1)", () => {
    expect(quadraticForm(INDEFINITE_MATRIX, unitVectorAtAngle(0))).toBeCloseTo(1, 10);
  });

  it("at 45 degrees is positive (3)", () => {
    expect(quadraticForm(INDEFINITE_MATRIX, unitVectorAtAngle(45))).toBeCloseTo(3, 10);
  });

  it("at 135 degrees is negative (-1) — proof the matrix is not PSD", () => {
    expect(quadraticForm(INDEFINITE_MATRIX, unitVectorAtAngle(135))).toBeCloseTo(-1, 10);
  });

  it("CHECKPOINT_ANGLE is exactly the angle where it goes negative", () => {
    expect(CHECKPOINT_ANGLE).toBe(135);
    expect(quadraticForm(INDEFINITE_MATRIX, unitVectorAtAngle(CHECKPOINT_ANGLE))).toBeLessThan(0);
  });
});

describe("isPSD", () => {
  it("is true for COVARIANCE's eigenvalues", () => {
    expect(isPSD(COVARIANCE_EIGENVALUES)).toBe(true);
  });

  it("is false for INDEFINITE_MATRIX's eigenvalues", () => {
    expect(isPSD([3, -1])).toBe(false);
  });
});

describe("principal axes are perpendicular (COVARIANCE is symmetric)", () => {
  it("MAX_VARIANCE_DIRECTION dot MIN_VARIANCE_DIRECTION is zero", () => {
    const dot = MAX_VARIANCE_DIRECTION.x * MIN_VARIANCE_DIRECTION.x + MAX_VARIANCE_DIRECTION.y * MIN_VARIANCE_DIRECTION.y;
    expect(dot).toBe(0);
  });
});
