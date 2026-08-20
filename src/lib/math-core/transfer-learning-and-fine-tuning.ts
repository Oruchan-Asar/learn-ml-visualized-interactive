/**
 * A slope of w=2 was already learned on a large source task. The target task is a tiny 2-point
 * dataset that shares that same slope but needs a different intercept: y = 2x + 5. Transfer
 * learning freezes the pretrained slope and fine-tunes only the intercept; training from scratch
 * has to rediscover both parameters from nothing, using the same 2 points and the same step budget.
 */
export const PRETRAINED_W = 2;
export const TARGET_POINTS: { x: number; y: number }[] = [
  { x: 1, y: 7 },
  { x: 3, y: 11 },
];

function predictions(w: number, b: number, points: { x: number; y: number }[]): number[] {
  return points.map((p) => w * p.x + b);
}

export function mse(w: number, b: number, points: { x: number; y: number }[] = TARGET_POINTS): number {
  const preds = predictions(w, b, points);
  return preds.reduce((sum, p, i) => sum + (points[i].y - p) ** 2, 0) / preds.length;
}

/** Transfer learning: w is frozen at the pretrained value; only b is trained. */
export function transferGradientB(b: number, w: number = PRETRAINED_W, points: { x: number; y: number }[] = TARGET_POINTS): number {
  const n = points.length;
  const sumResidual = points.reduce((sum, p) => sum + (w * p.x + b - p.y), 0);
  return (2 / n) * sumResidual;
}

export function transferTrace(learningRate: number, steps: number, startB = 0, w: number = PRETRAINED_W, points: { x: number; y: number }[] = TARGET_POINTS): number[] {
  const trace = [startB];
  let b = startB;
  for (let i = 0; i < steps; i++) {
    b = b - learningRate * transferGradientB(b, w, points);
    trace.push(b);
  }
  return trace;
}

export interface Weights {
  w: number;
  b: number;
}

/** From scratch: both w and b start at zero and are trained jointly on the same 2 points. */
export function fromScratchGradient(weights: Weights, points: { x: number; y: number }[] = TARGET_POINTS): Weights {
  const n = points.length;
  let gw = 0;
  let gb = 0;
  for (const p of points) {
    const residual = weights.w * p.x + weights.b - p.y;
    gw += residual * p.x;
    gb += residual;
  }
  return { w: (2 / n) * gw, b: (2 / n) * gb };
}

export function fromScratchTrace(learningRate: number, steps: number, start: Weights = { w: 0, b: 0 }, points: { x: number; y: number }[] = TARGET_POINTS): Weights[] {
  const trace = [start];
  let weights = start;
  for (let i = 0; i < steps; i++) {
    const g = fromScratchGradient(weights, points);
    weights = { w: weights.w - learningRate * g.w, b: weights.b - learningRate * g.b };
    trace.push(weights);
  }
  return trace;
}
