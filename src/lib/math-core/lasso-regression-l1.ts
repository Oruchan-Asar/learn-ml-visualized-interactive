import { X1, X2, Y, N, dot, type Weights } from "./ridge-regression-l2";

export { X1, X2, Y, N };

/** Soft-thresholding operator: the source of L1's exact-zero behavior. */
export function softThreshold(value: number, gamma: number): number {
  if (value > gamma) return value - gamma;
  if (value < -gamma) return value + gamma;
  return 0;
}

// Past ~0.8, the zeroed-out predictor re-enters (a known lasso quirk under correlated features —
// exactly what motivates ElasticNet). Capping the slider here keeps the story clean: one predictor
// stays exactly zero across this entire range.
export const LAMBDA_MAX = 0.75;

/**
 * Lasso (L1) on the same two-predictor toy dataset as ridge, via cyclic coordinate descent.
 * Objective: (1/2N)·SSE + λ(|w1| + |w2|), no intercept. Each coordinate update isolates one
 * weight, computes its correlation with the current residual (rho), then soft-thresholds it —
 * the same mechanism that lets a coefficient land exactly on zero instead of just shrinking toward it.
 * With two nearly-collinear predictors the coordinate updates fight over the same signal, so
 * convergence is slow — enough iterations are used here to land on the true fixed point exactly.
 */
export function lassoFit(lambda: number, iterations = 20000): Weights {
  const s1 = dot(X1, X1);
  const s2 = dot(X2, X2);
  let w1 = 0;
  let w2 = 0;
  for (let iter = 0; iter < iterations; iter++) {
    let rho1 = 0;
    for (let i = 0; i < N; i++) rho1 += X1[i] * (Y[i] - w2 * X2[i]);
    w1 = softThreshold(rho1, N * lambda) / s1;

    let rho2 = 0;
    for (let i = 0; i < N; i++) rho2 += X2[i] * (Y[i] - w1 * X1[i]);
    w2 = softThreshold(rho2, N * lambda) / s2;
  }
  return { w1, w2 };
}
