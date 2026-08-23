import { X1, X2, Y, N, dot, type Weights } from "./ridge-regression-l2";
import { softThreshold } from "./lasso-regression-l1";

export { X1, X2, Y, N };

/** Fixed total penalty strength for the mixing-parameter demo — only α (the L1/L2 mix) varies.
 *  Chosen so that the pure-lasso endpoint (α=1) sits inside lasso's own exact-zero region. */
export const LAMBDA = 0.5;
export const ALPHA_MIN = 0;
export const ALPHA_MAX = 1;

/**
 * ElasticNet on the same two-predictor toy dataset: minimizes (1/2N)·SSE + λ[α(|w1|+|w2|) + (1-α)/2·(w1²+w2²)],
 * via cyclic coordinate descent. The per-coordinate update generalizes both single-penalty cases:
 * soft-threshold by the L1 share (N·λ·α), then divide by the column's sum-of-squares *plus* the L2 share
 * (N·λ·(1-α)) instead of just the sum-of-squares. Set α=1 and it collapses to exactly lasso's update rule;
 * α=0 collapses to a coordinate-descent form of ridge (a differently-scaled λ than the closed-form ridge
 * chapter uses, since this objective averages the squared error over N points instead of summing it).
 */
export function elasticNetFit(alpha: number, lambda: number = LAMBDA, iterations = 20000): Weights {
  const s1 = dot(X1, X1);
  const s2 = dot(X2, X2);
  const l2Share = N * lambda * (1 - alpha);
  const l1Share = N * lambda * alpha;
  let w1 = 0;
  let w2 = 0;
  for (let iter = 0; iter < iterations; iter++) {
    let rho1 = 0;
    for (let i = 0; i < N; i++) rho1 += X1[i] * (Y[i] - w2 * X2[i]);
    w1 = softThreshold(rho1, l1Share) / (s1 + l2Share);

    let rho2 = 0;
    for (let i = 0; i < N; i++) rho2 += X2[i] * (Y[i] - w1 * X1[i]);
    w2 = softThreshold(rho2, l1Share) / (s2 + l2Share);
  }
  return { w1, w2 };
}
