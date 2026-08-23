/**
 * Three schedules for the same base learning rate, applied to the same toy optimization problem:
 * minimizing f(x) = x^2 by gradient descent, x_{t+1} = x_t*(1 - 2*lr(t)). The base rate (1.2) is
 * deliberately too large to use constantly -- descending x^2 needs lr < 1 to stay stable, so a
 * flat 1.2 diverges from step 1. Warmup avoids ever applying that rate while x is still far from
 * the optimum; cosine decay then eases it back down toward 0 for fine convergence at the end.
 */
export const BASE_LR = 1.2;
export const MIN_LR = 0;
export const WARMUP_STEPS = 4;
export const TOTAL_STEPS = 12;
export const STEP_DECAY_SIZE = 4;
export const STEP_DECAY_FACTOR = 0.5;
export const X0 = 10;

export function constantLR(_t: number): number {
  return BASE_LR;
}

export function stepDecayLR(t: number): number {
  return BASE_LR * Math.pow(STEP_DECAY_FACTOR, Math.floor(t / STEP_DECAY_SIZE));
}

/** Linear warmup from 0 to BASE_LR over WARMUP_STEPS, then cosine decay from BASE_LR down to MIN_LR. */
export function warmupCosineLR(t: number): number {
  if (t < WARMUP_STEPS) return (BASE_LR * t) / WARMUP_STEPS;
  const progress = (t - WARMUP_STEPS) / (TOTAL_STEPS - WARMUP_STEPS);
  return MIN_LR + 0.5 * (BASE_LR - MIN_LR) * (1 + Math.cos(Math.PI * progress));
}

export type ScheduleFn = (t: number) => number;

/** Runs gradient descent on f(x) = x^2 for `steps` iterations under the given schedule; xs[0] = X0. */
export function trajectory(lrFn: ScheduleFn, steps: number): number[] {
  const xs = [X0];
  let x = X0;
  for (let t = 0; t < steps; t++) {
    x = x * (1 - 2 * lrFn(t));
    xs.push(x);
  }
  return xs;
}

export function loss(x: number): number {
  return x * x;
}

export const TARGET_LOSS = 0.01;
export const STEP_BUDGET = TOTAL_STEPS;

/** The largest loss reached anywhere along a trajectory -- how badly it overshot along the way, not just where it ended up. */
export function maxLoss(xs: number[]): number {
  return Math.max(...xs.map(loss));
}

/** A trajectory "never overshoots" if it never exceeds this multiple of its own starting loss -- constant and step
 * decay both blow well past it before recovering; warmup keeps the loss at or below its starting value throughout. */
export const OVERSHOOT_TOLERANCE = 1.05;
