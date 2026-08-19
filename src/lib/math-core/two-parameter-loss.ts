import type { Vec2 } from "./vectors";

/** f(x,y) = (x-3)^2 + (y+2)^2 — a circular bowl with minimum at (3, -2). */
export function f(x: number, y: number): number {
  return (x - 3) ** 2 + (y + 2) ** 2;
}

export function gradient(x: number, y: number): Vec2 {
  return { x: 2 * (x - 3), y: 2 * (y + 2) };
}
