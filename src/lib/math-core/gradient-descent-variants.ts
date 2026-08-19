import type { Point } from "./linear-regression";
import { predict } from "./linear-regression";

export interface Params {
  w: number;
  b: number;
}

/**
 * A small, deliberately well-scaled dataset for this chapter — still y ≈ 2x + 1,
 * but centered near zero so the loss surface's gradients stay small enough to
 * descend with an ordinary learning rate. (Chapter 1's dataset, with x up to 9,
 * produces gradients in the hundreds — realistic, but a distraction from this
 * chapter's actual point: batch vs. stochastic vs. mini-batch.)
 */
export const VARIANTS_DATA_POINTS: Point[] = [
  { x: -2, y: -3.2 },
  { x: -1, y: -0.8 },
  { x: 0, y: 1.3 },
  { x: 1, y: 3.1 },
  { x: 2, y: 4.7 },
];

/**
 * The *mean* (not sum) squared-error gradient over whichever subset of points
 * is passed in — batch = every point, stochastic = one, mini-batch = a few.
 * Averaging (rather than summing) matters here: it keeps a one-point gradient
 * on the same scale as a five-point one, so batch/stochastic/mini-batch differ
 * in *noise*, not in step size, at the same learning rate.
 */
export function sseGradient(points: Point[], w: number, b: number): Params {
  let gw = 0;
  let gb = 0;
  for (const p of points) {
    const residual = p.y - predict(w, b, p.x);
    gw += -2 * p.x * residual;
    gb += -2 * residual;
  }
  return { w: gw / points.length, b: gb / points.length };
}
