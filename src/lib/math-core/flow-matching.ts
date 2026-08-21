/**
 * A diffusion model corrupts data with a carefully-tuned noise schedule and trains a model to reverse it
 * step by step. Flow matching skips the schedule entirely: draw the straight line between a noise point
 * and a data point, and train a model to predict that line's velocity. The line is linear in t, so its
 * velocity is exactly constant — no schedule to design, no approximation to make.
 */
export interface Pair {
  x0: number; // a noise sample
  x1: number; // a data sample
}

export const PAIRS: Pair[] = [
  { x0: -2, x1: 5 },
  { x0: 3, x1: -7 },
  { x0: 0, x1: 4 },
];

/** The straight-line path between noise and data: x_t = (1-t)x_0 + t x_1, for t in [0, 1]. */
export function positionAt(t: number, pair: Pair): number {
  return (1 - t) * pair.x0 + t * pair.x1;
}

/** The path's velocity, dx_t/dt — constant because the path is linear in t, independent of t entirely. */
export function velocity(pair: Pair): number {
  return pair.x1 - pair.x0;
}

/**
 * Generation: start at x_0 and integrate the (constant) velocity forward with Euler steps. Because the
 * true velocity never changes along this path, even a single giant step lands exactly on x_1 — there's
 * no discretization error to trade off against step count at all.
 */
export function euler(pair: Pair, steps: number): number {
  const dt = 1 / steps;
  let x = pair.x0;
  const v = velocity(pair);
  for (let i = 0; i < steps; i++) {
    x += v * dt;
  }
  return x;
}
