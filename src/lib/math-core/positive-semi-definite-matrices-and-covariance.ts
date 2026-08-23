import type { Mat2 } from "./matrices";
import type { Vec2 } from "./vectors";

export interface DataPoint {
  x: number;
  y: number;
}

/**
 * Four already-mean-centered 2D points (their average is exactly (0,0)), chosen so the population
 * covariance matrix comes out with clean integers: Var(x)=5, Var(y)=5, Cov(x,y)=3.
 */
export const DEVIATIONS: DataPoint[] = [
  { x: 3, y: 1 },
  { x: 1, y: 3 },
  { x: -3, y: -1 },
  { x: -1, y: -3 },
];

/** Population covariance matrix: Var(x), Var(y) on the diagonal, Cov(x,y) off it. */
export function covarianceMatrix(points: DataPoint[]): Mat2 {
  const n = points.length;
  const varX = points.reduce((s, p) => s + p.x * p.x, 0) / n;
  const varY = points.reduce((s, p) => s + p.y * p.y, 0) / n;
  const covXY = points.reduce((s, p) => s + p.x * p.y, 0) / n;
  return { a: varX, b: covXY, c: covXY, d: varY };
}

/** [[5,3],[3,5]] — symmetric and, as any covariance matrix must be, positive semi-definite. */
export const COVARIANCE: Mat2 = covarianceMatrix(DEVIATIONS);

/** Eigenvalues of COVARIANCE: 8 (direction of maximum variance) and 2 (direction of minimum variance). */
export const COVARIANCE_EIGENVALUES: [number, number] = [8, 2];

/** Direction of maximum spread in the data cloud — the top principal axis. */
export const MAX_VARIANCE_DIRECTION: Vec2 = { x: 1, y: 1 };

/** Direction of minimum spread — perpendicular to the max-variance direction, since COVARIANCE is symmetric. */
export const MIN_VARIANCE_DIRECTION: Vec2 = { x: 1, y: -1 };

/**
 * A symmetric matrix that is NOT positive semi-definite (eigenvalues 3 and -1) — for contrast with
 * COVARIANCE. No real dataset's covariance matrix could ever look like this one.
 */
export const INDEFINITE_MATRIX: Mat2 = { a: 1, b: 2, c: 2, d: 1 };

/** v^T M v — the quadratic form. For a unit vector v, this is the variance of the data along v when M is a covariance matrix. */
export function quadraticForm(m: Mat2, v: Vec2): number {
  return v.x * (m.a * v.x + m.b * v.y) + v.y * (m.c * v.x + m.d * v.y);
}

/** A unit vector at the given angle (degrees), measured counterclockwise from the x-axis. */
export function unitVectorAtAngle(degrees: number): Vec2 {
  const radians = (degrees * Math.PI) / 180;
  return { x: Math.cos(radians), y: Math.sin(radians) };
}

/** Whether m is PSD, judged from its known eigenvalues rather than computed generically. */
export function isPSD(eigenvalues: [number, number]): boolean {
  return eigenvalues[0] >= 0 && eigenvalues[1] >= 0;
}

/** The eight angles the checkpoint and demos snap to — each a clean multiple of 45 degrees. */
export const SNAP_ANGLES: number[] = [0, 45, 90, 135, 180, 225, 270, 315];

/** The one angle (of SNAP_ANGLES) where INDEFINITE_MATRIX's quadratic form goes negative, proving it isn't PSD. */
export const CHECKPOINT_ANGLE = 135;
