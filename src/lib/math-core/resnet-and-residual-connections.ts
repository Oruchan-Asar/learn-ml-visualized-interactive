import { sigmoid, sigmoidDerivative } from "./activation-functions";
import { FIXED_WEIGHT, INPUT_X0, TARGET } from "./vanishing-gradients";

export { FIXED_WEIGHT, INPUT_X0, TARGET };

export interface ResidualResult {
  h: number[];
  /** dL/dh_i for i = 0..depth, i.e. the loss gradient reaching each layer's output. */
  gradients: number[];
}

/**
 * Same per-layer transformation F(h) = weight*sigmoid(weight*h) as the plain network in the
 * vanishing-gradients chapter — but each layer now adds F(h) to h instead of replacing h with it:
 * h_i = h_{i-1} + F(h_{i-1}). That single addition changes the backward multiplier from
 * F'(h_{i-1}) alone to 1 + F'(h_{i-1}), which can never shrink below 1.
 */
export function residualForwardBackward(depth: number, weight: number = FIXED_WEIGHT): ResidualResult {
  const z: number[] = [];
  const h: number[] = [INPUT_X0];
  for (let i = 1; i <= depth; i++) {
    const zi = weight * h[i - 1];
    z.push(zi);
    h.push(h[i - 1] + weight * sigmoid(zi));
  }
  const gradients = new Array(depth + 1).fill(0);
  gradients[depth] = h[depth] - TARGET;
  for (let i = depth; i >= 1; i--) {
    const localDerivative = 1 + weight * sigmoidDerivative(z[i - 1]) * weight;
    gradients[i - 1] = gradients[i] * localDerivative;
  }
  return { h, gradients };
}

export function residualGradientAtInput(depth: number, weight: number = FIXED_WEIGHT): number {
  return Math.abs(residualForwardBackward(depth, weight).gradients[0]);
}
