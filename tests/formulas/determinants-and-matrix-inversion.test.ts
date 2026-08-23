import { describe, it, expect } from "vitest";
import {
  determinant,
  isSingular,
  inverse,
  multiply,
  IDENTITY,
  mapUnitSquare,
  MATRIX_A,
  SINGULAR_MATRIX,
  CHECKPOINT_MATRIX,
} from "@/lib/math-core/determinants-and-matrix-inversion";

describe("determinant", () => {
  it("is 4 for MATRIX_A (3*2 - 1*2)", () => {
    expect(determinant(MATRIX_A)).toBe(4);
  });

  it("is 0 for SINGULAR_MATRIX (parallel columns)", () => {
    expect(determinant(SINGULAR_MATRIX)).toBe(0);
  });

  it("is 2 for CHECKPOINT_MATRIX", () => {
    expect(determinant(CHECKPOINT_MATRIX)).toBe(2);
  });
});

describe("isSingular", () => {
  it("is false for MATRIX_A", () => {
    expect(isSingular(MATRIX_A)).toBe(false);
  });

  it("is true for SINGULAR_MATRIX", () => {
    expect(isSingular(SINGULAR_MATRIX)).toBe(true);
  });
});

describe("inverse", () => {
  it("computes (1/4)[[2,-1],[-2,3]] for MATRIX_A", () => {
    expect(inverse(MATRIX_A)).toEqual({ a: 0.5, b: -0.25, c: -0.5, d: 0.75 });
  });

  it("is null for a singular matrix", () => {
    expect(inverse(SINGULAR_MATRIX)).toBeNull();
  });

  it("A * A^-1 = I", () => {
    const inv = inverse(MATRIX_A)!;
    const product = multiply(MATRIX_A, inv);
    expect(product.a).toBeCloseTo(IDENTITY.a, 10);
    expect(product.b).toBeCloseTo(IDENTITY.b, 10);
    expect(product.c).toBeCloseTo(IDENTITY.c, 10);
    expect(product.d).toBeCloseTo(IDENTITY.d, 10);
  });
});

describe("mapUnitSquare", () => {
  it("maps the unit square's corners through MATRIX_A", () => {
    expect(mapUnitSquare(MATRIX_A)).toEqual([
      [0, 0],
      [3, 2],
      [4, 4],
      [1, 2],
    ]);
  });

  it("collapses the unit square onto a line for a singular matrix", () => {
    const mapped = mapUnitSquare(SINGULAR_MATRIX);
    // (0,0) and (1,1)->(6,3) both lie on the same line through the origin as (2,1) and (4,2).
    expect(mapped[0]).toEqual([0, 0]);
    expect(mapped[1]).toEqual([2, 1]);
    expect(mapped[3]).toEqual([4, 2]);
  });
});
