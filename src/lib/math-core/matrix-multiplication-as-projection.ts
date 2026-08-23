import { dot, type Vec2 } from "./vectors";

/**
 * A matrix with two identical (linearly dependent) columns has rank 1 — its column space collapses
 * from the whole plane down to a single line. This is that line, spanned by one column vector.
 */
export const COLUMN_A: Vec2 = { x: 2, y: 1 };

/** A target vector b that is NOT on the line spanned by COLUMN_A, so Ax=b has no exact solution. */
export const WORKED_B: Vec2 = { x: 3, y: 4 };

/**
 * The scalar t that makes t*a the closest point on the line to b — found by requiring the residual
 * (b - t*a) be perpendicular to a, i.e. a . (b - t*a) = 0, which solves to t = (a.b)/(a.a).
 */
export function scalarProjectionCoefficient(a: Vec2, b: Vec2): number {
  return dot(a, b) / dot(a, a);
}

/** The projection of b onto the line spanned by a: the closest point to b that Ax can actually reach. */
export function projectOnto(a: Vec2, b: Vec2): Vec2 {
  const t = scalarProjectionCoefficient(a, b);
  return { x: t * a.x, y: t * a.y };
}

/** b minus its projection — the part of b the column space of A can never account for. */
export function residual(a: Vec2, b: Vec2): Vec2 {
  const p = projectOnto(a, b);
  return { x: b.x - p.x, y: b.y - p.y };
}

/** Whether b already lies exactly on the line spanned by a, i.e. Ax=b has an exact solution. */
export function isSolvable(a: Vec2, b: Vec2, eps = 1e-9): boolean {
  return magnitudeOf(residual(a, b)) < eps;
}

function magnitudeOf(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/** The target point the checkpoint asks the learner to reach by dragging b: the projection from the worked example. */
export const CHECKPOINT_TARGET_P: Vec2 = projectOnto(COLUMN_A, WORKED_B);

/** A b that lies exactly on the line (a clean multiple of a), for contrast with WORKED_B. */
export const ON_LINE_B: Vec2 = { x: 4, y: 2 };
