import { apply, type Mat2 } from "./matrices";
import { angleBetweenDegrees, magnitude, type Vec2 } from "./vectors";

/**
 * A symmetric matrix with one positive and one negative eigenvalue, chosen so every number in this
 * chapter's decomposition comes out exact: eigenvalues 3 and -1, eigenvectors at +/-45 degrees.
 */
export const MATRIX: Mat2 = { a: 1, b: 2, c: 2, d: 1 };

export const EIGENVALUES: [number, number] = [3, -1];
export const SINGULAR_VALUES: [number, number] = [3, 1];

const R = Math.SQRT1_2; // 1/sqrt(2)

/** The two eigenvectors, at 45 degrees and -45 degrees, each satisfying Av = lambda*v exactly. */
export const EIGENVECTOR_1: Vec2 = { x: R, y: R };
export const EIGENVECTOR_2: Vec2 = { x: R, y: -R };

/** A*v, for any vector v (not just unit length). */
export function transform(v: Vec2): Vec2 {
  return apply(MATRIX, v);
}

/**
 * The angle between v and Av, in degrees — scale-invariant, so it depends only on v's direction. It's
 * exactly 0 along the eigenvector-1 direction (A only stretches there, never rotates), exactly 180
 * along the eigenvector-2 direction (A stretches AND flips), and something in between everywhere else.
 */
export function rotationAngle(v: Vec2): number {
  return angleBetweenDegrees(v, transform(v));
}

/** |Av| / |v| — how much MATRIX stretches this particular direction. */
export function stretchRatio(v: Vec2): number {
  return magnitude(transform(v)) / magnitude(v);
}

/**
 * U * Sigma * V^T, reconstructed from the singular vectors/values, to verify it equals MATRIX exactly.
 * Singular values must be non-negative, so the eigenvalue -1 direction's left singular vector u2 is
 * the eigenvector flipped (u2 = -v2) — that flip is what keeps A*v2 = singularValue2 * u2 true.
 */
export function reconstructFromSVD(): Mat2 {
  const v1 = EIGENVECTOR_1;
  const v2 = EIGENVECTOR_2;
  const u1 = v1;
  const u2: Vec2 = { x: -v2.x, y: -v2.y };
  const [s1, s2] = SINGULAR_VALUES;
  return {
    a: s1 * u1.x * v1.x + s2 * u2.x * v2.x,
    b: s1 * u1.x * v1.y + s2 * u2.x * v2.y,
    c: s1 * u1.y * v1.x + s2 * u2.y * v2.x,
    d: s1 * u1.y * v1.y + s2 * u2.y * v2.y,
  };
}

/** How far A*v is from lambda*v — zero exactly at a true eigenvector/eigenvalue pair. */
export function eigenvalueResidual(v: Vec2, lambda: number): number {
  const av = transform(v);
  return magnitude({ x: av.x - lambda * v.x, y: av.y - lambda * v.y });
}
