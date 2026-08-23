import type { Vec2 } from "./vectors";

/** f(x, y) = x^2 + y^2 — a circular bowl, minimum at the origin. */
export function f(x: number, y: number): number {
  return x * x + y * y;
}

/** The gradient vector: (∂f/∂x, ∂f/∂y) = (2x, 2y). */
export function gradient(x: number, y: number): Vec2 {
  return { x: 2 * x, y: 2 * y };
}

/** Central-difference numerical gradient, used only to cross-check `gradient`. */
export function numericalGradient(x: number, y: number, h = 1e-4): Vec2 {
  return {
    x: (f(x + h, y) - f(x - h, y)) / (2 * h),
    y: (f(x, y + h) - f(x, y - h)) / (2 * h),
  };
}
