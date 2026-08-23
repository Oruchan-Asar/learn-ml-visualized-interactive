/**
 * RoPE never adds a position vector to the content embedding the way sinusoidal encoding does. Instead
 * it rotates the query and key vectors themselves — by an angle proportional to each one's position —
 * before taking their dot product. A rotation is a distance- and angle-preserving map, so rotating both
 * vectors by the same amount changes nothing about the angle *between* them. Rotating them by different
 * amounts is exactly equivalent to leaving one fixed and rotating the other by the *difference* of the
 * two angles. That's the whole trick: the dot product of two rotated vectors depends only on how far
 * apart their rotation angles are — i.e. only on relative position — never on either position alone.
 */
export type Vec2 = [number, number];

/** Radians of rotation applied per position step. Chosen as π/2 so every rotation lands on an axis exactly. */
export const THETA = Math.PI / 2;

export const Q0: Vec2 = [1, 0.5];
export const K0: Vec2 = [0.5, 1];

export function dot2D(a: Vec2, b: Vec2): number {
  return a[0] * b[0] + a[1] * b[1];
}

/** Rotates a 2D vector counterclockwise by the given angle, in radians. */
export function rotate2D(v: Vec2, angle: number): Vec2 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c];
}

/** The RoPE-transformed vector for a token at a given position: rotate it by position × θ. */
export function ropeVector(v: Vec2, pos: number, theta: number = THETA): Vec2 {
  return rotate2D(v, pos * theta);
}

/** Plain, position-blind dot product — what attention would compute with no positional information at all. */
export function plainDot(q: Vec2 = Q0, k: Vec2 = K0): number {
  return dot2D(q, k);
}

/** The RoPE-rotated dot product between a query at posQ and a key at posK. */
export function ropeDot(posQ: number, posK: number, q: Vec2 = Q0, k: Vec2 = K0, theta: number = THETA): number {
  return dot2D(ropeVector(q, posQ, theta), ropeVector(k, posK, theta));
}

/** Discrete positions used by the demos and checkpoint — one full period of THETA = π/2 is 4 steps. */
export const POSITIONS = [0, 1, 2, 3, 4];

/** Absolute starting offsets used to demonstrate that a fixed relative distance always scores the same. */
export const ABSOLUTE_STARTS = [0, 1, 3, 5, 8];
