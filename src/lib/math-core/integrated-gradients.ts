export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** A deliberately steep model: by x=2 it's deep in saturation, where the raw gradient goes nearly to zero. */
export const STEEPNESS = 5;

export function model(x: number): number {
  return sigmoid(STEEPNESS * x);
}

export function modelGradient(x: number): number {
  const s = sigmoid(STEEPNESS * x);
  return STEEPNESS * s * (1 - s);
}

export const BASELINE = 0;
export const INPUT = 2;

/** Plain saliency: the gradient at the input alone — cheap, but blind to saturation. */
export function plainSaliency(input: number = INPUT): number {
  return modelGradient(input);
}

/**
 * Integrated gradients: a Riemann-sum approximation of the exact integral of the gradient along
 * the straight-line path from baseline to input. More steps means a finer-grained walk along that
 * path, not a different destination.
 */
export function integratedGradients(steps: number, baseline: number = BASELINE, input: number = INPUT): number {
  let sum = 0;
  for (let k = 1; k <= steps; k++) {
    const alpha = k / steps;
    const point = baseline + alpha * (input - baseline);
    sum += modelGradient(point);
  }
  return (input - baseline) * (sum / steps);
}

/** The completeness axiom: attributions should sum exactly to the change in output. This is the gap from that ideal. */
export function completenessGap(steps: number, baseline: number = BASELINE, input: number = INPUT): number {
  const trueDelta = model(input) - model(baseline);
  return Math.abs(trueDelta - integratedGradients(steps, baseline, input));
}

export function outputDelta(baseline: number = BASELINE, input: number = INPUT): number {
  return model(input) - model(baseline);
}
