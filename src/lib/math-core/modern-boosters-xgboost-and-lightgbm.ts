import { GBM_POINTS, GBM_F0, GBM_ROUNDS, gbmPredict } from "./gradient-boosting-machines";

export { GBM_POINTS, GBM_DOMAIN, GBM_Y_DOMAIN, GBM_F0, GBM_ROUNDS } from "./gradient-boosting-machines";

/**
 * Plain gradient boosting fits a leaf to the mean of its residuals. XGBoost instead takes a second-order
 * (Newton) step on the loss: each point contributes a gradient g_i AND a Hessian h_i, and the optimal leaf
 * value is w* = -G/(H + lambda), where G and H are the leaf's summed gradients and Hessians.
 *
 * For squared-error loss L = (1/2)(y - F)^2, the gradient is g_i = F(x_i) - y_i and the true Hessian is
 * exactly 1 for every point — which is why, at lambda=0 and hessianPerPoint=1, this formula reproduces plain
 * gradient boosting's leaf values exactly (verified below). hessianPerPoint is exposed as a toy dial so a
 * loss with more or less curvature than squared error can be explored without changing the rest of the setup.
 */

/** Round 2's gradients g_i = F1(x_i) - y_i, evaluated at the same 5 points GBM used for its own round 2. */
export const ROUND2_GRADIENTS: number[] = GBM_POINTS.map((p) => gbmPredict(GBM_F0, GBM_ROUNDS, 1, p.x) - p.y);

/** The exact split GBM's round 2 already found (x = 4.5) — reused rather than re-derived. */
export const ROUND2_THRESHOLD: number = GBM_ROUNDS[1].stump.threshold;

export type LeafSide = "left" | "right";

function inLeaf(x: number, threshold: number, side: LeafSide): boolean {
  return side === "left" ? x < threshold : x >= threshold;
}

export function leafGradientSum(threshold: number, side: LeafSide): number {
  return GBM_POINTS.reduce(
    (sum, p, i) => (inLeaf(p.x, threshold, side) ? sum + ROUND2_GRADIENTS[i] : sum),
    0,
  );
}

export function leafSize(threshold: number, side: LeafSide): number {
  return GBM_POINTS.filter((p) => inLeaf(p.x, threshold, side)).length;
}

/** The Newton-boosting optimal leaf weight: w* = -G / (H + lambda). */
export function newtonLeafValue(gradientSum: number, hessianSum: number, lambda: number): number {
  return -gradientSum / (hessianSum + lambda);
}

/** hessianPerPoint is a toy per-point Hessian (1 for plain squared error); lambda is the L2 regularization strength. */
export function xgboostLeafValue(
  threshold: number,
  side: LeafSide,
  lambda: number,
  hessianPerPoint: number,
): number {
  const G = leafGradientSum(threshold, side);
  const H = leafSize(threshold, side) * hessianPerPoint;
  return newtonLeafValue(G, H, lambda);
}

/** The regularized combined prediction after round 2, using the Newton leaf values instead of plain means. */
export function xgboostPredict(
  x: number,
  lambda: number,
  hessianPerPoint: number,
): number {
  const f1 = gbmPredict(GBM_F0, GBM_ROUNDS, 1, x);
  const side: LeafSide = x < ROUND2_THRESHOLD ? "left" : "right";
  return f1 + xgboostLeafValue(ROUND2_THRESHOLD, side, lambda, hessianPerPoint);
}

export function sampleXgboostCurve(
  lambda: number,
  hessianPerPoint: number,
  domain: [number, number],
  resolution = 240,
): { x: number; y: number }[] {
  const [dMin, dMax] = domain;
  return Array.from({ length: resolution + 1 }, (_, i) => {
    const x = dMin + ((dMax - dMin) * i) / resolution;
    return { x, y: xgboostPredict(x, lambda, hessianPerPoint) };
  });
}

export const DEFAULT_HESSIAN = 1;
export const MAX_LAMBDA = 3;
export const MAX_HESSIAN = 3;
