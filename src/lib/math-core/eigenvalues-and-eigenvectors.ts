import { apply, type Mat2 } from "./matrices";
import { angleBetweenDegrees, dot, magnitude, type Vec2 } from "./vectors";

/**
 * A non-symmetric matrix (unlike the symmetric one used in the later SVD chapter), chosen so its
 * eigenvalues and eigenvectors come out as clean integers: eigenvalues 5 and 2, eigenvectors (1,1)
 * and (1,-2). Because A isn't symmetric, these two eigenvectors are NOT perpendicular to each other.
 */
export const MATRIX: Mat2 = { a: 4, b: 1, c: 2, d: 3 };

export const EIGENVALUES: [number, number] = [5, 2];

/** Satisfies A*v = 5*v exactly: A*(1,1) = (5,5). */
export const EIGENVECTOR_1: Vec2 = { x: 1, y: 1 };

/** Satisfies A*v = 2*v exactly: A*(1,-2) = (2,-4). */
export const EIGENVECTOR_2: Vec2 = { x: 1, y: -2 };

/** A*v, for any vector v. */
export function transform(v: Vec2): Vec2 {
  return apply(MATRIX, v);
}

/**
 * The angle between v and Av, in degrees — scale-invariant, so it depends only on v's direction. It's
 * exactly 0 along both eigenvector directions (A only stretches there, since both eigenvalues are
 * positive), and something in between everywhere else.
 */
export function rotationAngle(v: Vec2): number {
  return angleBetweenDegrees(v, transform(v));
}

/** |Av| / |v| — how much MATRIX stretches this particular direction. */
export function stretchRatio(v: Vec2): number {
  return magnitude(transform(v)) / magnitude(v);
}

/** How far A*v is from lambda*v — zero exactly at a true eigenvector/eigenvalue pair. */
export function eigenvalueResidual(v: Vec2, lambda: number): number {
  const av = transform(v);
  return magnitude({ x: av.x - lambda * v.x, y: av.y - lambda * v.y });
}

/**
 * det(A - lambda*I) = (4-lambda)(3-lambda) - 1*2 — the characteristic polynomial. It's exactly zero
 * at both eigenvalues and nonzero everywhere else, which is precisely what makes them eigenvalues.
 */
export function characteristicPolynomial(lambda: number): number {
  return (MATRIX.a - lambda) * (MATRIX.d - lambda) - MATRIX.b * MATRIX.c;
}

/** Re-exported so callers checking the two eigenvectors are NOT orthogonal don't need a second import. */
export { dot };
