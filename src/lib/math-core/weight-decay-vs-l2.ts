/**
 * Two toy parameters that only differ in how much squared-gradient history an adaptive optimizer
 * has accumulated for them: w1 is rarely updated (small v), w2 is updated constantly (large v).
 * Both start at the same weight value, so any difference in how hard they get regularized comes
 * purely from that history -- exactly the scenario where L2-in-the-gradient and decoupled weight
 * decay stop agreeing.
 */
export const LR = 0.1;
export const EPS = 1e-8;
export const W1 = 1;
export const W2 = 1;
export const V1 = 0.01; // rarely-updated parameter: small accumulated squared gradient
export const V2 = 4; // frequently-updated parameter: large accumulated squared gradient
export const LAMBDA_DOMAIN: [number, number] = [0, 1];

/**
 * L2 regularization folded into the gradient before Adam's per-parameter division by sqrt(v):
 * the penalty itself gets rescaled by the same adaptive factor as the task gradient, so a
 * parameter with a large v (like w2) is barely regularized no matter how big lambda is.
 */
export function l2CoupledDecay(w: number, v: number, lambda: number): number {
  return (LR * lambda * w) / (Math.sqrt(v) + EPS);
}

/**
 * Decoupled weight decay (as in AdamW): the shrinkage is applied directly to the weight,
 * completely bypassing the adaptive per-parameter scaling -- every parameter decays by the
 * same fraction, regardless of its gradient history.
 */
export function decoupledDecay(w: number, lambda: number): number {
  return LR * lambda * w;
}

/** Plain SGD has no adaptive per-parameter scaling at all -- equivalent to v = 1 above, where the two formulas coincide. */
export const SGD_EQUIVALENT_V = 1;

export const DESTRUCTIVE_FRACTION = 0.5; // decay >= 50% of w1 in a single step: clearly destabilizing
export const SAFE_FRACTION = 0.1; // decoupled decay staying under 10% of w1 in that same step
