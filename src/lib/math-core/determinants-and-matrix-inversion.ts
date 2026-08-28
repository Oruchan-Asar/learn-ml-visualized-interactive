import type { Mat2 } from "./matrices";

/** ad - bc: the signed factor by which A scales area, and the switch that decides whether A is invertible. */
export function determinant(m: Mat2): number {
  return m.a * m.d - m.b * m.c;
}

/** A matrix is singular exactly when its determinant is zero — its columns collapse onto a single line. */
export function isSingular(m: Mat2): boolean {
  return determinant(m) === 0;
}

/** A^-1 = (1/det) * [[d, -b], [-c, a]] — undefined (returns null) exactly when A is singular. */
export function inverse(m: Mat2): Mat2 | null {
  const det = determinant(m);
  if (det === 0) return null;
  return {
    a: m.d / det,
    b: -m.b / det,
    c: -m.c / det,
    d: m.a / det,
  };
}

export function multiply(m1: Mat2, m2: Mat2): Mat2 {
  return {
    a: m1.a * m2.a + m1.b * m2.c,
    b: m1.a * m2.b + m1.b * m2.d,
    c: m1.c * m2.a + m1.d * m2.c,
    d: m1.c * m2.b + m1.d * m2.d,
  };
}

export const IDENTITY: Mat2 = { a: 1, b: 0, c: 0, d: 1 };

/** The four corners of the unit square, in order, so mapping them through A traces the image parallelogram. */
export const UNIT_SQUARE: [number, number][] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

/** Maps the unit square's corners through m — the resulting polygon's area is exactly |det(m)|. */
export function mapUnitSquare(m: Mat2): [number, number][] {
  return UNIT_SQUARE.map(([x, y]) => [m.a * x + m.b * y, m.c * x + m.d * y]);
}

/** Invertible: det = 3*2 - 1*2 = 4. Clean inverse with quarter-integer entries. */
export const MATRIX_A: Mat2 = { a: 3, b: 1, c: 2, d: 2 };

/** Singular: columns (2,1) and (4,2) are parallel — the second is exactly 2x the first, so det = 0. */
export const SINGULAR_MATRIX: Mat2 = { a: 2, b: 4, c: 1, d: 2 };

/** For the checkpoint: det = 1*1 - (-1)*1 = 2. Columns are perpendicular (a 45°-rotated square of area 2), so the parallelogram renders clearly instead of collapsing into a near-parallel sliver. */
export const CHECKPOINT_MATRIX: Mat2 = { a: 1, b: -1, c: 1, d: 1 };
