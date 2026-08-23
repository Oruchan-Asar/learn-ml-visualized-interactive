/**
 * Toy dataset: two nearly-identical (highly correlated) predictors trying to explain the same target.
 * X2 tracks X1 almost exactly (correlation ≈ 0.998) — exactly the "collinear predictors" scenario
 * ridge is built to stabilize. No intercept, so the normal equations are a plain 2x2 system.
 */
export const X1 = [1, 2, 3, 4];
export const X2 = [1, 2, 3, 4.5];
export const Y = [2, 4, 7, 8];
export const N = X1.length;

export function dot(a: number[], b: number[]): number {
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}

export interface Weights {
  w1: number;
  w2: number;
}

/** Pearson correlation between the two predictors — by construction, very close to 1. */
export const CORRELATION = dot(X1, X2) / Math.sqrt(dot(X1, X1) * dot(X2, X2));

export const LAMBDA_MAX = 6;

/**
 * Ridge (L2), closed form: minimizes SSE + λ(w1² + w2²) with no intercept term to penalize.
 * The normal equations (X^TX + λI)w = X^Ty reduce to a 2x2 linear system, solved directly
 * via Cramer's rule — everything here is hand-checkable arithmetic.
 */
export function ridgeFit(lambda: number): Weights {
  const a11 = dot(X1, X1) + lambda;
  const a12 = dot(X1, X2);
  const a22 = dot(X2, X2) + lambda;
  const b1 = dot(X1, Y);
  const b2 = dot(X2, Y);
  const det = a11 * a22 - a12 * a12;
  return {
    w1: (a22 * b1 - a12 * b2) / det,
    w2: (a11 * b2 - a12 * b1) / det,
  };
}

export function predict(w: Weights, x1: number, x2: number): number {
  return w.w1 * x1 + w.w2 * x2;
}

/** Sum of squared errors of a weight pair over the whole toy dataset. */
export function sse(w: Weights): number {
  return X1.reduce((sum, x1, i) => sum + (Y[i] - predict(w, x1, X2[i])) ** 2, 0);
}
