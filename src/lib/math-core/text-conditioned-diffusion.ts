import { BETAS, ALPHAS, T } from "./diffusion-models";

export { BETAS, ALPHAS, T };

/**
 * The exact same reverse diffusion step from the unconditioned chapter, but now the "predicted
 * noise" at each step comes from a caption-specific sequence — standing in for a denoiser network
 * that takes a text embedding as an extra input. Same starting noise, different caption, different
 * picture: that's the entire mechanism.
 */
export const SHARED_X_T = 2.0;
export const UNCONDITIONAL_NOISE: number[] = [0, 0, 0, 0];
export const CAT_NOISE: number[] = [1, -0.5, 0.8, -1.2];
export const DOG_NOISE: number[] = [-0.6, 0.9, -0.3, 0.7];

export interface DiffusionStep {
  t: number;
  value: number;
}

export function conditionedReverse(noiseSequence: number[], xT: number = SHARED_X_T): DiffusionStep[] {
  const steps: DiffusionStep[] = [{ t: T, value: xT }];
  let x = xT;
  for (let t = T - 1; t >= 0; t--) {
    const predictedNoise = noiseSequence[t];
    x = (x - Math.sqrt(BETAS[t]) * predictedNoise) / Math.sqrt(ALPHAS[t]);
    steps.push({ t, value: x });
  }
  return steps;
}

export function finalX0(noiseSequence: number[], xT: number = SHARED_X_T): number {
  const steps = conditionedReverse(noiseSequence, xT);
  return steps[steps.length - 1].value;
}
