import { describe, it, expect } from "vitest";
import {
  MATRIX,
  EIGENVALUES,
  EIGENVECTOR_1,
  EIGENVECTOR_2,
  transform,
  rotationAngle,
  stretchRatio,
  eigenvalueResidual,
  characteristicPolynomial,
  dot,
} from "@/lib/math-core/eigenvalues-and-eigenvectors";

describe("transform", () => {
  it("A*(1,1) = (5,5)", () => {
    expect(transform(EIGENVECTOR_1)).toEqual({ x: 5, y: 5 });
  });

  it("A*(1,-2) = (2,-4)", () => {
    expect(transform(EIGENVECTOR_2)).toEqual({ x: 2, y: -4 });
  });
});

describe("eigenvalueResidual", () => {
  it("is exactly zero for eigenvector 1 with eigenvalue 5", () => {
    expect(eigenvalueResidual(EIGENVECTOR_1, EIGENVALUES[0])).toBeCloseTo(0, 10);
  });

  it("is exactly zero for eigenvector 2 with eigenvalue 2", () => {
    expect(eigenvalueResidual(EIGENVECTOR_2, EIGENVALUES[1])).toBeCloseTo(0, 10);
  });

  it("is nonzero for a non-eigenvector", () => {
    expect(eigenvalueResidual({ x: 1, y: 0 }, EIGENVALUES[0])).toBeGreaterThan(0.5);
  });
});

describe("rotationAngle", () => {
  it("is (numerically) 0 along eigenvector 1", () => {
    // acos is ill-conditioned right at cos=1, so a few ulps of floating-point error in the
    // sqrt-based magnitude computation show up as a small-but-nonzero angle here; still tiny
    // compared to the ~60+ degree rotation an arbitrary direction gets below.
    expect(rotationAngle(EIGENVECTOR_1)).toBeCloseTo(0, 4);
  });

  it("is (numerically) 0 along eigenvector 2 (both eigenvalues are positive here)", () => {
    expect(rotationAngle(EIGENVECTOR_2)).toBeCloseTo(0, 4);
  });

  it("is nonzero for an arbitrary direction", () => {
    expect(rotationAngle({ x: 1, y: 0 })).toBeGreaterThan(1);
  });
});

describe("stretchRatio", () => {
  it("is exactly 5 along eigenvector 1", () => {
    expect(stretchRatio(EIGENVECTOR_1)).toBeCloseTo(5, 10);
  });

  it("is exactly 2 along eigenvector 2", () => {
    expect(stretchRatio(EIGENVECTOR_2)).toBeCloseTo(2, 10);
  });
});

describe("characteristicPolynomial", () => {
  it("is zero at both eigenvalues", () => {
    expect(characteristicPolynomial(EIGENVALUES[0])).toBeCloseTo(0, 10);
    expect(characteristicPolynomial(EIGENVALUES[1])).toBeCloseTo(0, 10);
  });

  it("matches trace/det identities: sum = 7, product = 10", () => {
    expect(EIGENVALUES[0] + EIGENVALUES[1]).toBe(MATRIX.a + MATRIX.d);
    expect(EIGENVALUES[0] * EIGENVALUES[1]).toBe(MATRIX.a * MATRIX.d - MATRIX.b * MATRIX.c);
  });

  it("is nonzero away from the eigenvalues", () => {
    expect(characteristicPolynomial(0)).not.toBeCloseTo(0, 5);
  });
});

describe("the two eigenvectors of this non-symmetric matrix are not orthogonal", () => {
  it("their dot product is nonzero", () => {
    expect(dot(EIGENVECTOR_1, EIGENVECTOR_2)).toBe(-1);
  });
});
