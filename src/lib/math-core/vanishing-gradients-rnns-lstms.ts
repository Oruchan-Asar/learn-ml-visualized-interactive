function tanh(x: number): number {
  return Math.tanh(x);
}
function tanhPrime(x: number): number {
  const t = tanh(x);
  return 1 - t * t;
}

/** Same token every step ([1, 0]) — isolates how the recurrence itself behaves over many timesteps. */
const WX = [1, -1];
const BIAS = 0;

/**
 * The gradient of the final hidden state w.r.t. the first, for a plain RNN: a product,
 * one factor per timestep, of tanh'(z_t) * Wh — the exact same shrinking-derivative chain
 * as Part III's depth-vs-vanishing-gradients chapter, just running across time instead of layers.
 */
export function rnnGradientProduct(steps: number, wh: number): number {
  let h = 0;
  let grad = 1;
  for (let t = 1; t <= steps; t++) {
    const z = WX[0] * 1 + WX[1] * 0 + wh * h + BIAS;
    const hNext = tanh(z);
    if (t >= 2) grad *= tanhPrime(z) * wh;
    h = hNext;
  }
  return grad;
}

/**
 * The gradient of the final cell state w.r.t. the first, for an LSTM's cell-state path: a
 * product of the forget gate alone, with no squashing derivative attached at each step.
 */
export function lstmGradientProduct(steps: number, forgetGate: number): number {
  return Math.pow(forgetGate, steps - 1);
}

export const DEFAULT_WEIGHT = 0.9;
export const MIN_STEPS = 1;
export const MAX_STEPS = 20;
export const DEFAULT_STEPS = 3;
export const TARGET_RATIO = 1e6;
