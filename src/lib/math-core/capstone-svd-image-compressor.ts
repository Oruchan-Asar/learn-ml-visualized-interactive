export type Matrix = number[][];

/**
 * A 4x4 toy "image" of pixel intensities, built by construction from two clean orthonormal patterns
 * (a "flat" pattern and a "checkerboard-quadrant" pattern) so its SVD is exact and hand-verifiable
 * rather than something to be numerically estimated.
 */
export const IMAGE: Matrix = [
  [3, 3, 1, 1],
  [3, 3, 1, 1],
  [1, 1, 3, 3],
  [1, 1, 3, 3],
];

/** Singular values, already sorted descending. */
export const SINGULAR_VALUES: [number, number] = [8, 4];

/** The "flat" singular vector: every pixel contributes equally. Unit length: 4*(0.5)^2 = 1. */
export const U1: number[] = [0.5, 0.5, 0.5, 0.5];

/** The "top-half vs. bottom-half" singular vector — orthogonal to U1, also unit length. */
export const U2: number[] = [0.5, 0.5, -0.5, -0.5];

/** IMAGE is symmetric and built as u.u^T, so the same vector serves as both left and right singular vector. */
export function outerProduct(u: number[], v: number[]): Matrix {
  return u.map((ui) => v.map((vj) => ui * vj));
}

export function scaleMatrix(m: Matrix, s: number): Matrix {
  return m.map((row) => row.map((v) => v * s));
}

export function addMatrices(a: Matrix, b: Matrix): Matrix {
  return a.map((row, i) => row.map((v, j) => v + b[i][j]));
}

export function subtractMatrices(a: Matrix, b: Matrix): Matrix {
  return a.map((row, i) => row.map((v, j) => v - b[i][j]));
}

export function frobeniusNorm(m: Matrix): number {
  return Math.sqrt(m.reduce((sum, row) => sum + row.reduce((s, v) => s + v * v, 0), 0));
}

const ZERO: Matrix = [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
];

/** Reconstructing IMAGE from its k largest singular components (k=0 for nothing, up to k=2 for exact). */
export function rankKReconstruction(k: 0 | 1 | 2): Matrix {
  if (k === 0) return ZERO;
  let result = scaleMatrix(outerProduct(U1, U1), SINGULAR_VALUES[0]);
  if (k === 2) result = addMatrices(result, scaleMatrix(outerProduct(U2, U2), SINGULAR_VALUES[1]));
  return result;
}

/** ||IMAGE - reconstruction||_F — shrinks from the full image norm at k=0 to exactly 0 at k=2. */
export function reconstructionError(k: 0 | 1 | 2): number {
  return frobeniusNorm(subtractMatrices(IMAGE, rankKReconstruction(k)));
}

/** Fraction of the image's total squared-intensity "energy" captured by the k largest singular values. */
export function energyRetained(k: 0 | 1 | 2): number {
  const total = SINGULAR_VALUES[0] ** 2 + SINGULAR_VALUES[1] ** 2;
  if (k === 0) return 0;
  if (k === 1) return SINGULAR_VALUES[0] ** 2 / total;
  return 1;
}

/** The reconstruction-error threshold used by the checkpoint. */
export const CHECKPOINT_ERROR_THRESHOLD = 4.5;
