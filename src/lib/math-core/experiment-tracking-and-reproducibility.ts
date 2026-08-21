export interface StepTrace {
  step: number;
  gradient: number;
  noise: number;
  weightBefore: number;
  weightAfter: number;
}

export interface RunResult {
  seed: number;
  lr: number;
  trace: StepTrace[];
  finalWeight: number;
}

export const INITIAL_WEIGHT = 10;
export const GRADIENTS = [2, 1, 3];
export const LR = 1;

const LCG_A = 5;
const LCG_C = 1;
const LCG_M = 16;

/** A tiny linear congruential generator — the "unlogged" source of randomness behind every run. */
export function lcgSequence(seed: number, count: number): number[] {
  const seq: number[] = [];
  let x = seed;
  for (let i = 0; i < count; i++) {
    x = (LCG_A * x + LCG_C) % LCG_M;
    seq.push(x);
  }
  return seq;
}

/** Turns raw LCG output into small integer noise in [-2, 2]. */
export function noiseFromSeed(seed: number, count: number): number[] {
  return lcgSequence(seed, count).map((x) => (x % 5) - 2);
}

/** Runs the same fixed gradient schedule with a given seed and learning rate. Identical (lr, gradients), different seed, different trajectory. */
export function runTraining(seed: number, lr: number = LR): RunResult {
  const noises = noiseFromSeed(seed, GRADIENTS.length);
  let weight = INITIAL_WEIGHT;
  const trace: StepTrace[] = GRADIENTS.map((g, i) => {
    const weightBefore = weight;
    const weightAfter = weightBefore - lr * (g + noises[i]);
    weight = weightAfter;
    return { step: i + 1, gradient: g, noise: noises[i], weightBefore, weightAfter };
  });
  return { seed, lr, trace, finalWeight: weight };
}

/** The two runs compared in the Play beat: same lr, different seeds. */
export const SHOWN_SEEDS = [1, 2];

/** Seeds offered in the checkpoint, including the two already shown. */
export const CHECKPOINT_SEEDS = [1, 2, 3, 4];

/** The final weight of a run whose seed is hidden from the learner — they must find which seed reproduces it. */
export const CHECKPOINT_TARGET_SEED = 3;
export const CHECKPOINT_TARGET_FINAL_WEIGHT = runTraining(CHECKPOINT_TARGET_SEED).finalWeight;
