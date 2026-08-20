/**
 * Two-feature linear regression, y = w1*x1 + w2*x2, with x1 on a tiny scale (±1) and x2 on a
 * scale 100x larger (±100). The design is orthogonal (sum of x1*x2 is zero across the four points),
 * so gradient descent on w1 and w2 evolves independently — each behaves exactly like the single-weight
 * quadratic from the hyperparameter-tuning chapter, just with wildly different curvature.
 */
export const TRUE_W1 = 3;
export const TRUE_W2 = 0.02;
export const X1: number[] = [1, 1, -1, -1];
export const X2: number[] = [100, -100, 100, -100];
export const Y: number[] = X1.map((x1, i) => TRUE_W1 * x1 + TRUE_W2 * X2[i]);

export interface Weights {
  w1: number;
  w2: number;
}

export function predictions(w: Weights, x1: number[], x2: number[]): number[] {
  return x1.map((v, i) => w.w1 * v + w.w2 * x2[i]);
}

export function mse(w: Weights, x1: number[] = X1, x2: number[] = X2, y: number[] = Y): number {
  const preds = predictions(w, x1, x2);
  return preds.reduce((sum, p, i) => sum + (y[i] - p) ** 2, 0) / preds.length;
}

/** Gradient of MSE with respect to (w1, w2) — plain calculus, no assumption of orthogonality baked in. */
export function gradient(w: Weights, x1: number[] = X1, x2: number[] = X2, y: number[] = Y): Weights {
  const n = x1.length;
  const preds = predictions(w, x1, x2);
  let gw1 = 0;
  let gw2 = 0;
  for (let i = 0; i < n; i++) {
    const residual = preds[i] - y[i];
    gw1 += residual * x1[i];
    gw2 += residual * x2[i];
  }
  return { w1: (2 / n) * gw1, w2: (2 / n) * gw2 };
}

export function step(w: Weights, learningRate: number, x1: number[] = X1, x2: number[] = X2, y: number[] = Y): Weights {
  const g = gradient(w, x1, x2, y);
  return { w1: w.w1 - learningRate * g.w1, w2: w.w2 - learningRate * g.w2 };
}

export function train(learningRate: number, steps: number, x1: number[] = X1, x2: number[] = X2, y: number[] = Y, start: Weights = { w1: 0, w2: 0 }): Weights[] {
  const trace = [start];
  let w = start;
  for (let i = 0; i < steps; i++) {
    w = step(w, learningRate, x1, x2, y);
    trace.push(w);
  }
  return trace;
}

/** Standardizing x2 down to x1's scale: dividing by 100 makes both features range across ±1. */
export const X2_SCALE = 100;
export const X2_SCALED: number[] = X2.map((v) => v / X2_SCALE);
/** The true weight on the scaled feature, so that w2_scaled * x2_scaled === w2 * x2. */
export const TRUE_W2_SCALED = TRUE_W2 * X2_SCALE;
