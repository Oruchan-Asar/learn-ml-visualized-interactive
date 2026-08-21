import type { Pair } from "./flow-matching";

export type { Pair };

/**
 * Chapter 3 computed one pair's exact velocity by hand. A real flow-matching model has to work for
 * *any* starting noise, not just the pairs it saw in training — it has to learn a velocity field.
 * This capstone trains the simplest possible one: a single constant v̄, fit by least squares to several
 * training pairs' velocities. Least squares under a constant model has a closed-form solution — the
 * mean — so "training" here is one line of arithmetic, and the result is a real (if extremely limited)
 * generative sampler: apply v̄ to brand-new noise the model never saw during training.
 */
export const TRAINING_PAIRS: Pair[] = [
  { x0: -3, x1: 6 },
  { x0: -1, x1: 4 },
  { x0: -4, x1: 8 },
  { x0: -2, x1: 5 },
];

export function pairVelocity(pair: Pair): number {
  return pair.x1 - pair.x0;
}

/** The least-squares-optimal constant velocity field: the mean of every training pair's velocity. */
export function trainVelocityField(pairs: Pair[] = TRAINING_PAIRS): number {
  const velocities = pairs.map(pairVelocity);
  return velocities.reduce((a, b) => a + b, 0) / velocities.length;
}

/** Generation: integrate the trained (constant) field from a fresh noise sample, in `steps` Euler steps. */
export function generate(x0: number, trainedVelocity: number, steps: number): number {
  const dt = 1 / steps;
  let x = x0;
  for (let i = 0; i < steps; i++) {
    x += trainedVelocity * dt;
  }
  return x;
}

export const TEST_NOISE_POINTS = [-5, -2, 0, 3];
export const TARGET_VALUE = 7;
