export interface Vec2 {
  x: number;
  y: number;
}

/** A 2x2 matrix [[a, b], [c, d]]. */
export interface Matrix2 {
  a: number;
  b: number;
  c: number;
  d: number;
}

/** Scalar field f(x, y) = x^2 + xy + y^2 — a tilted bowl, used for the gradient/Hessian half of the chapter. */
export function f(x: number, y: number): number {
  return x * x + x * y + y * y;
}

/** Gradient of f: (∂f/∂x, ∂f/∂y) = (2x + y, x + 2y). */
export function gradientF(x: number, y: number): Vec2 {
  return { x: 2 * x + y, y: x + 2 * y };
}

/** Hessian of f — the matrix of second partials. Constant here because f is quadratic. */
export const HESSIAN: Matrix2 = { a: 2, b: 1, c: 1, d: 2 };

/** Vector-valued map F(x, y) = (x^2 + y, x + y^2), used for the Jacobian half of the chapter. */
export function F(x: number, y: number): Vec2 {
  return { x: x * x + y, y: x + y * y };
}

/**
 * Jacobian of F at (x, y): row i holds the partials of F's i-th output.
 * [[∂F1/∂x, ∂F1/∂y], [∂F2/∂x, ∂F2/∂y]] = [[2x, 1], [1, 2y]].
 * Unlike the Hessian above, this genuinely changes from point to point.
 */
export function jacobian(x: number, y: number): Matrix2 {
  return { a: 2 * x, b: 1, c: 1, d: 2 * y };
}

export function determinant2(m: Matrix2): number {
  return m.a * m.d - m.b * m.c;
}

export function trace2(m: Matrix2): number {
  return m.a + m.d;
}

/** Renders a Matrix2 as a 2x2 grid, row-major, for the KernelHeatmap viz. */
export function toGrid(m: Matrix2): number[][] {
  return [
    [m.a, m.b],
    [m.c, m.d],
  ];
}

/** A symmetric matrix is positive definite (here) iff its top-left entry and its determinant are both positive. */
export function isPositiveDefinite2(m: Matrix2): boolean {
  return m.a > 0 && determinant2(m) > 0;
}
