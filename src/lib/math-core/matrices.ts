import type { Vec2 } from "./vectors";

/** A 2×2 matrix, laid out as [[a, b], [c, d]]. */
export interface Mat2 {
  a: number;
  b: number;
  c: number;
  d: number;
}

/** Mv — apply the matrix to a vector. */
export function apply(m: Mat2, v: Vec2): Vec2 {
  return {
    x: m.a * v.x + m.b * v.y,
    y: m.c * v.x + m.d * v.y,
  };
}

export const ROTATE_90: Mat2 = { a: 0, b: -1, c: 1, d: 0 };
export const SCALE: Mat2 = { a: 2, b: 0, c: 0, d: 0.5 };
export const FLIP_X: Mat2 = { a: -1, b: 0, c: 0, d: 1 };
export const SHEAR: Mat2 = { a: 1, b: 1, c: 0, d: 1 };
