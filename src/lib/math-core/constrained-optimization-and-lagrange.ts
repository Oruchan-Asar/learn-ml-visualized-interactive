export interface Vec2 {
  x: number;
  y: number;
}

/** Objective: f(x,y) = x^2 + y^2 — squared distance from the origin. */
export function f(x: number, y: number): number {
  return x * x + y * y;
}

export function gradientF(x: number, y: number): Vec2 {
  return { x: 2 * x, y: 2 * y };
}

/** Equality constraint: g(x,y) = x + y - 4 = 0 — every feasible point lies on this line. */
export function g(x: number, y: number): number {
  return x + y - 4;
}

/** ∇g is constant everywhere: (1, 1). */
export const GRADIENT_G: Vec2 = { x: 1, y: 1 };

/** A point on the constraint line, parametrized by its x-coordinate (y = 4 - x). */
export function pointOnConstraint(x: number): Vec2 {
  return { x, y: 4 - x };
}

/**
 * Lagrange's condition ∇f = λ∇g requires ∇f's two components to be equal (since ∇g = (1,1)).
 * This "alignment error" is 2x − 2y; it is exactly zero only at the constrained optimum, where
 * the level curve of f is tangent to the constraint line.
 */
export function alignmentError(x: number, y: number): number {
  const grad = gradientF(x, y);
  return grad.x - grad.y;
}

/** The multiplier λ implied by matching ∇f = λ∇g componentwise: λ = ∂f/∂x = 2x (or equivalently ∂f/∂y = 2y). */
export function impliedLambdaFromX(x: number): number {
  return 2 * x;
}

export function impliedLambdaFromY(y: number): number {
  return 2 * y;
}

export const CONSTRAINED_OPTIMUM: Vec2 = { x: 2, y: 2 };
export const CONSTRAINED_OPTIMUM_VALUE = 8;
export const CONSTRAINED_OPTIMUM_LAMBDA = 4;

export const DOMAIN: [number, number] = [-0.2, 4.2];
export const ALIGNMENT_TOLERANCE = 0.3;
