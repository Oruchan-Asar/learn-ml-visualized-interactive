const EPSILON = 1e-12;

function clampProbability(p: number): number {
  return Math.min(1 - EPSILON, Math.max(EPSILON, p));
}

/** Binary cross-entropy loss for one example: true label y ∈ {0,1}, predicted probability p. */
export function crossEntropyLoss(y: 0 | 1, p: number): number {
  const clamped = clampProbability(p);
  return y === 1 ? -Math.log(clamped) : -Math.log(1 - clamped);
}

/** d(loss)/dp, for the tangent line in the visualization. */
export function crossEntropyLossDerivative(y: 0 | 1, p: number): number {
  const clamped = clampProbability(p);
  return y === 1 ? -1 / clamped : 1 / (1 - clamped);
}

/** What squared error would have given for the same (y, p) — bounded, unlike cross-entropy. */
export function squaredErrorLoss(y: 0 | 1, p: number): number {
  return (y - p) ** 2;
}

/** Average cross-entropy loss across many predictions. */
export function meanCrossEntropyLoss(predictions: number[], labels: (0 | 1)[]): number {
  const total = predictions.reduce((sum, p, i) => sum + crossEntropyLoss(labels[i], p), 0);
  return total / predictions.length;
}
