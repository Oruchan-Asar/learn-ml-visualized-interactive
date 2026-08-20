export interface Vec2 {
  x: number;
  y: number;
}

/** A true local minimum — curves upward in every direction. */
export function bowl(x: number, y: number): number {
  return x * x + y * y;
}

export function bowlGradient(x: number, y: number): Vec2 {
  return { x: 2 * x, y: 2 * y };
}

/** A saddle point — curves upward in x, downward in y. Gradient is still exactly zero at the origin. */
export function saddle(x: number, y: number): number {
  return x * x - y * y;
}

export function saddleGradient(x: number, y: number): Vec2 {
  return { x: 2 * x, y: -2 * y };
}

/** Probability that, for a random critical point in n independent dimensions, every one happens to curve upward (a true minimum) rather than at least one curving down (a saddle). */
export function probabilityAllUpward(dimensions: number): number {
  return 0.5 ** dimensions;
}

export const LANDSCAPE_DOMAIN: [number, number] = [-3, 3];
export const TARGET_VALUE = -2;
