import type { Mat2 } from "./matrices";
import type { Vec2 } from "./vectors";

const R = Math.SQRT1_2; // 1/sqrt(2)

/** The two singular values of MATRIX, already sorted descending: 5 (dominant) and 1 (small). */
export const SINGULAR_VALUES: [number, number] = [5, 1];

/** Left/right singular vectors for singular value 1 (identical here, since MATRIX is symmetric). */
export const U1: Vec2 = { x: R, y: R };
export const V1: Vec2 = U1;

/** Left/right singular vectors for singular value 2. */
export const U2: Vec2 = { x: R, y: -R };
export const V2: Vec2 = U2;

/**
 * A = sigma1*u1*v1^T + sigma2*u2*v2^T, built directly from clean orthonormal singular vectors so the
 * SVD is exact by construction rather than something to be numerically approximated: [[3,2],[2,3]].
 */
export const MATRIX: Mat2 = addMat(
  outerScaled(SINGULAR_VALUES[0], U1, V1),
  outerScaled(SINGULAR_VALUES[1], U2, V2),
);

export function outerScaled(sigma: number, u: Vec2, v: Vec2): Mat2 {
  return { a: sigma * u.x * v.x, b: sigma * u.x * v.y, c: sigma * u.y * v.x, d: sigma * u.y * v.y };
}

export function addMat(m1: Mat2, m2: Mat2): Mat2 {
  return { a: m1.a + m2.a, b: m1.b + m2.b, c: m1.c + m2.c, d: m1.d + m2.d };
}

export function subtractMat(m1: Mat2, m2: Mat2): Mat2 {
  return { a: m1.a - m2.a, b: m1.b - m2.b, c: m1.c - m2.c, d: m1.d - m2.d };
}

export function frobeniusNorm(m: Mat2): number {
  return Math.sqrt(m.a * m.a + m.b * m.b + m.c * m.c + m.d * m.d);
}

/** The best rank-k (k=1 or 2) approximation of MATRIX, per the Eckart-Young theorem: keep the k largest singular terms. */
export function rankKApproximation(matrix: Mat2, singularValues: [number, number], u1: Vec2, v1: Vec2, u2: Vec2, v2: Vec2, k: 1 | 2): Mat2 {
  const term1 = outerScaled(singularValues[0], u1, v1);
  if (k === 1) return term1;
  return addMat(term1, outerScaled(singularValues[1], u2, v2));
}

/** Rank-1 (dropping the small singular value) or rank-2 (exact) approximation of MATRIX specifically. */
export function matrixRankKApproximation(k: 1 | 2): Mat2 {
  return rankKApproximation(MATRIX, SINGULAR_VALUES, U1, V1, U2, V2, k);
}

/** ||A - A_k||_F — by Eckart-Young this equals exactly the singular values dropped, combined in quadrature. */
export function reconstructionError(k: 1 | 2): number {
  return frobeniusNorm(subtractMat(MATRIX, matrixRankKApproximation(k)));
}

/** Fraction of the squared Frobenius norm (total "energy") captured by keeping the k largest singular values. */
export function energyRetained(singularValues: [number, number], k: 1 | 2): number {
  const total = singularValues[0] ** 2 + singularValues[1] ** 2;
  const kept = k === 1 ? singularValues[0] ** 2 : total;
  return kept / total;
}

/** A second matrix (same singular directions, different singular values 6 and 2) for the checkpoint. */
export const CHECKPOINT_SINGULAR_VALUES: [number, number] = [6, 2];
export const CHECKPOINT_MATRIX: Mat2 = addMat(
  outerScaled(CHECKPOINT_SINGULAR_VALUES[0], U1, V1),
  outerScaled(CHECKPOINT_SINGULAR_VALUES[1], U2, V2),
);

export function checkpointRankKApproximation(k: 1 | 2): Mat2 {
  return rankKApproximation(CHECKPOINT_MATRIX, CHECKPOINT_SINGULAR_VALUES, U1, V1, U2, V2, k);
}

export function checkpointReconstructionError(k: 1 | 2): number {
  return frobeniusNorm(subtractMat(CHECKPOINT_MATRIX, checkpointRankKApproximation(k)));
}
