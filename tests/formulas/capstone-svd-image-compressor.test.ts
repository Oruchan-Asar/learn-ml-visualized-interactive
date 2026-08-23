import { describe, it, expect } from "vitest";
import {
  IMAGE,
  SINGULAR_VALUES,
  U1,
  U2,
  CHECKPOINT_ERROR_THRESHOLD,
  outerProduct,
  rankKReconstruction,
  reconstructionError,
  energyRetained,
} from "@/lib/math-core/capstone-svd-image-compressor";

describe("U1 and U2 are orthonormal", () => {
  it("U1 has unit norm", () => {
    expect(U1.reduce((s, v) => s + v * v, 0)).toBeCloseTo(1, 10);
  });

  it("U2 has unit norm", () => {
    expect(U2.reduce((s, v) => s + v * v, 0)).toBeCloseTo(1, 10);
  });

  it("U1 and U2 are orthogonal", () => {
    const dot = U1.reduce((s, v, i) => s + v * U2[i], 0);
    expect(dot).toBeCloseTo(0, 10);
  });
});

describe("rankKReconstruction", () => {
  it("k=0 is all zeros", () => {
    expect(rankKReconstruction(0)).toEqual([
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
  });

  it("k=1 is a flat image of value 2 everywhere (8 * 0.5 * 0.5)", () => {
    const r = rankKReconstruction(1);
    for (const row of r) for (const v of row) expect(v).toBeCloseTo(2, 10);
  });

  it("k=2 reconstructs IMAGE exactly", () => {
    const r = rankKReconstruction(2);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) expect(r[i][j]).toBeCloseTo(IMAGE[i][j], 10);
  });

  it("outerProduct(U1, U1) scaled by 8 matches the k=1 reconstruction", () => {
    const term = outerProduct(U1, U1).map((row) => row.map((v) => v * SINGULAR_VALUES[0]));
    const r = rankKReconstruction(1);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) expect(term[i][j]).toBeCloseTo(r[i][j], 10);
  });
});

describe("reconstructionError shrinks to zero as rank increases", () => {
  it("k=0 error equals the full image's own Frobenius norm, sqrt(80)", () => {
    expect(reconstructionError(0)).toBeCloseTo(Math.sqrt(80), 10);
  });

  it("k=1 error is exactly 4 (the dropped singular value)", () => {
    expect(reconstructionError(1)).toBeCloseTo(4, 10);
    expect(reconstructionError(1)).toBeCloseTo(SINGULAR_VALUES[1], 10);
  });

  it("k=2 error is exactly 0", () => {
    expect(reconstructionError(2)).toBeCloseTo(0, 10);
  });

  it("k=1 error is below the checkpoint threshold but k=0's is not", () => {
    expect(reconstructionError(1)).toBeLessThan(CHECKPOINT_ERROR_THRESHOLD);
    expect(reconstructionError(0)).toBeGreaterThan(CHECKPOINT_ERROR_THRESHOLD);
  });
});

describe("energyRetained", () => {
  it("k=0 retains none of it", () => {
    expect(energyRetained(0)).toBe(0);
  });

  it("k=1 retains 80% (64/80)", () => {
    expect(energyRetained(1)).toBeCloseTo(0.8, 10);
  });

  it("k=2 retains all of it", () => {
    expect(energyRetained(2)).toBe(1);
  });
});
