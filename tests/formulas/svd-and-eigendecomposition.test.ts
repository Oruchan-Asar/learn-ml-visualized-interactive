import { describe, it, expect } from "vitest";
import {
  MATRIX,
  EIGENVALUES,
  SINGULAR_VALUES,
  EIGENVECTOR_1,
  EIGENVECTOR_2,
  transform,
  rotationAngle,
  stretchRatio,
  reconstructFromSVD,
  eigenvalueResidual,
} from "@/lib/math-core/svd-and-eigendecomposition";

describe("the eigenvectors satisfy Av = lambda*v exactly", () => {
  it("eigenvector 1 with eigenvalue 3", () => {
    expect(eigenvalueResidual(EIGENVECTOR_1, EIGENVALUES[0])).toBeCloseTo(0, 10);
  });

  it("eigenvector 2 with eigenvalue -1", () => {
    expect(eigenvalueResidual(EIGENVECTOR_2, EIGENVALUES[1])).toBeCloseTo(0, 10);
  });

  it("a non-eigenvector has a nonzero residual against either eigenvalue", () => {
    const arbitrary = { x: 1, y: 0 };
    expect(eigenvalueResidual(arbitrary, EIGENVALUES[0])).toBeGreaterThan(0.5);
    expect(eigenvalueResidual(arbitrary, EIGENVALUES[1])).toBeGreaterThan(0.5);
  });
});

describe("rotationAngle is 0 or 180 only along the eigenvector directions", () => {
  it("is exactly 0 along eigenvector 1 — A only stretches it, never rotates it", () => {
    expect(rotationAngle(EIGENVECTOR_1)).toBeCloseTo(0, 10);
  });

  it("is exactly 180 along eigenvector 2 — A stretches AND flips it", () => {
    expect(rotationAngle(EIGENVECTOR_2)).toBeCloseTo(180, 10);
  });

  it("is scale-invariant — a longer vector along the same direction gives the same angle", () => {
    const scaled = { x: EIGENVECTOR_1.x * 5, y: EIGENVECTOR_1.y * 5 };
    expect(rotationAngle(scaled)).toBeCloseTo(0, 5);
  });

  it("is some in-between value for an arbitrary direction", () => {
    expect(rotationAngle({ x: 1, y: 0 })).toBeCloseTo(63.43494882292201, 8);
    expect(rotationAngle({ x: 0, y: 1 })).toBeCloseTo(63.43494882292201, 8);
  });
});

describe("stretchRatio matches the eigenvalue's magnitude at the eigenvector directions", () => {
  it("matches |3| at eigenvector 1", () => {
    expect(stretchRatio(EIGENVECTOR_1)).toBeCloseTo(3, 10);
  });

  it("matches |-1| at eigenvector 2", () => {
    expect(stretchRatio(EIGENVECTOR_2)).toBeCloseTo(1, 10);
  });

  it("matches sqrt(5) along the x-axis, by direct computation of A*(1,0) = (1,2)", () => {
    const av = transform({ x: 1, y: 0 });
    expect(av).toEqual({ x: 1, y: 2 });
    expect(stretchRatio({ x: 1, y: 0 })).toBeCloseTo(Math.sqrt(5), 10);
  });
});

describe("SVD reconstruction recovers the original matrix exactly", () => {
  it("U * Sigma * V^T equals MATRIX", () => {
    const reconstructed = reconstructFromSVD();
    expect(reconstructed.a).toBeCloseTo(MATRIX.a, 10);
    expect(reconstructed.b).toBeCloseTo(MATRIX.b, 10);
    expect(reconstructed.c).toBeCloseTo(MATRIX.c, 10);
    expect(reconstructed.d).toBeCloseTo(MATRIX.d, 10);
  });

  it("the singular values are the absolute values of the eigenvalues, sorted descending", () => {
    expect(SINGULAR_VALUES).toEqual([Math.abs(EIGENVALUES[0]), Math.abs(EIGENVALUES[1])]);
  });
});
