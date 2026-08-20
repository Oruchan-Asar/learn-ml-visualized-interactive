import { sigmoid, sigmoidDerivative } from "./activation-functions";

export const FIXED_WEIGHT = 3;
export const INPUT_X0 = 0.5;
export const TARGET = 1;
export const MAX_DEPTH = 10;
export const VANISH_THRESHOLD = 1e-6;

export interface BackwardResult {
  /** dL/dh_i for i = 0..depth, i.e. the loss gradient reaching each layer's output, including the input (index 0). */
  gradients: number[];
}

/** Runs a chain of `depth` sigmoid layers (each z_i = w*h_{i-1}) forward, then the loss gradient backward through all of them. */
export function forwardBackward(depth: number, weight = FIXED_WEIGHT): BackwardResult {
  const z: number[] = [];
  const h: number[] = [INPUT_X0];
  for (let i = 1; i <= depth; i++) {
    const zi = weight * h[i - 1];
    z.push(zi);
    h.push(sigmoid(zi));
  }
  const gradients = new Array(depth + 1).fill(0);
  gradients[depth] = h[depth] - TARGET;
  for (let i = depth; i >= 1; i--) {
    gradients[i - 1] = gradients[i] * sigmoidDerivative(z[i - 1]) * weight;
  }
  return { gradients };
}

/** The gradient magnitude that actually reaches the very first layer, |dL/dh_0|. */
export function gradientAtInput(depth: number, weight = FIXED_WEIGHT): number {
  return Math.abs(forwardBackward(depth, weight).gradients[0]);
}
