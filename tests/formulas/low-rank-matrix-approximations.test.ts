import { describe, it, expect } from "vitest";
import {
  MATRIX,
  SINGULAR_VALUES,
  U1,
  U2,
  CHECKPOINT_MATRIX,
  CHECKPOINT_SINGULAR_VALUES,
  matrixRankKApproximation,
  reconstructionError,
  energyRetained,
  checkpointRankKApproximation,
  checkpointReconstructionError,
  frobeniusNorm,
  subtractMat,
} from "@/lib/math-core/low-rank-matrix-approximations";

describe("MATRIX is built exactly from its singular value decomposition", () => {
  it("equals [[3,2],[2,3]]", () => {
    expect(MATRIX.a).toBeCloseTo(3, 10);
    expect(MATRIX.b).toBeCloseTo(2, 10);
    expect(MATRIX.c).toBeCloseTo(2, 10);
    expect(MATRIX.d).toBeCloseTo(3, 10);
  });

  it("U1 and U2 are orthonormal", () => {
    expect(U1.x * U1.x + U1.y * U1.y).toBeCloseTo(1, 10);
    expect(U2.x * U2.x + U2.y * U2.y).toBeCloseTo(1, 10);
    expect(U1.x * U2.x + U1.y * U2.y).toBeCloseTo(0, 10);
  });
});

describe("matrixRankKApproximation", () => {
  it("rank-1 keeps only the sigma=5 term: all entries 2.5", () => {
    const approx = matrixRankKApproximation(1);
    expect(approx.a).toBeCloseTo(2.5, 10);
    expect(approx.b).toBeCloseTo(2.5, 10);
    expect(approx.c).toBeCloseTo(2.5, 10);
    expect(approx.d).toBeCloseTo(2.5, 10);
  });

  it("rank-2 reconstructs MATRIX exactly", () => {
    const approx = matrixRankKApproximation(2);
    expect(approx.a).toBeCloseTo(MATRIX.a, 10);
    expect(approx.b).toBeCloseTo(MATRIX.b, 10);
    expect(approx.c).toBeCloseTo(MATRIX.c, 10);
    expect(approx.d).toBeCloseTo(MATRIX.d, 10);
  });
});

describe("reconstructionError follows Eckart-Young exactly", () => {
  it("rank-1 error equals the dropped singular value, 1", () => {
    expect(reconstructionError(1)).toBeCloseTo(SINGULAR_VALUES[1], 10);
    expect(reconstructionError(1)).toBeCloseTo(1, 10);
  });

  it("rank-2 error is exactly zero", () => {
    expect(reconstructionError(2)).toBeCloseTo(0, 10);
  });
});

describe("energyRetained", () => {
  it("rank-1 retains 25/26 of the squared Frobenius energy", () => {
    expect(energyRetained(SINGULAR_VALUES, 1)).toBeCloseTo(25 / 26, 10);
  });

  it("rank-2 retains all of it", () => {
    expect(energyRetained(SINGULAR_VALUES, 2)).toBeCloseTo(1, 10);
  });
});

describe("checkpoint matrix [[4,2],[2,4]] with singular values 6 and 2", () => {
  it("is built correctly", () => {
    expect(CHECKPOINT_MATRIX.a).toBeCloseTo(4, 10);
    expect(CHECKPOINT_MATRIX.b).toBeCloseTo(2, 10);
    expect(CHECKPOINT_MATRIX.c).toBeCloseTo(2, 10);
    expect(CHECKPOINT_MATRIX.d).toBeCloseTo(4, 10);
  });

  it("rank-1 reconstruction error equals the dropped singular value, 2", () => {
    expect(checkpointReconstructionError(1)).toBeCloseTo(CHECKPOINT_SINGULAR_VALUES[1], 10);
    expect(checkpointReconstructionError(1)).toBeCloseTo(2, 10);
  });

  it("rank-2 reconstruction error is zero", () => {
    expect(checkpointReconstructionError(2)).toBeCloseTo(0, 10);
  });

  it("the rank-1 term itself has entries 3 (6 * 0.5), not the full matrix", () => {
    const rank1 = checkpointRankKApproximation(1);
    expect(frobeniusNorm(subtractMat(rank1, { a: 3, b: 3, c: 3, d: 3 }))).toBeCloseTo(0, 10);
  });
});
