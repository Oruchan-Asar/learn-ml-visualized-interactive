import { describe, expect, it } from "vitest";
import {
  GRADIENTS,
  INITIAL_WEIGHT,
  LR,
  lcgSequence,
  noiseFromSeed,
  runTraining,
  SHOWN_SEEDS,
  CHECKPOINT_SEEDS,
  CHECKPOINT_TARGET_SEED,
  CHECKPOINT_TARGET_FINAL_WEIGHT,
} from "@/lib/math-core/experiment-tracking-and-reproducibility";

describe("experiment-tracking-and-reproducibility", () => {
  it("has fixed hyperparameters shared by every run", () => {
    expect(INITIAL_WEIGHT).toBe(10);
    expect(GRADIENTS).toEqual([2, 1, 3]);
    expect(LR).toBe(1);
  });

  it("generates a deterministic LCG sequence from a seed", () => {
    expect(lcgSequence(1, 3)).toEqual([6, 15, 12]);
    expect(lcgSequence(2, 3)).toEqual([11, 8, 9]);
  });

  it("maps LCG output to small integer noise", () => {
    expect(noiseFromSeed(1, 3)).toEqual([-1, -2, 0]);
    expect(noiseFromSeed(2, 3)).toEqual([-1, 1, 2]);
  });

  it("seed 1 and seed 2 diverge to different final weights despite identical hyperparameters", () => {
    const runA = runTraining(1);
    const runB = runTraining(2);
    expect(runA.finalWeight).toBe(7);
    expect(runB.finalWeight).toBe(2);
    expect(runA.lr).toBe(runB.lr);
  });

  it("produces the full step trace for seed 1", () => {
    const run = runTraining(1);
    expect(run.trace).toEqual([
      { step: 1, gradient: 2, noise: -1, weightBefore: 10, weightAfter: 9 },
      { step: 2, gradient: 1, noise: -2, weightBefore: 9, weightAfter: 10 },
      { step: 3, gradient: 3, noise: 0, weightBefore: 10, weightAfter: 7 },
    ]);
  });

  it("SHOWN_SEEDS and CHECKPOINT_SEEDS are set up correctly", () => {
    expect(SHOWN_SEEDS).toEqual([1, 2]);
    expect(CHECKPOINT_SEEDS).toEqual([1, 2, 3, 4]);
  });

  it("the checkpoint target's final weight is unique among the checkpoint seeds' final weights", () => {
    const finals = CHECKPOINT_SEEDS.map((s) => runTraining(s).finalWeight);
    expect(finals).toEqual([7, 2, 8, 7]);
    expect(CHECKPOINT_TARGET_SEED).toBe(3);
    expect(CHECKPOINT_TARGET_FINAL_WEIGHT).toBe(8);
    expect(finals.filter((f) => f === CHECKPOINT_TARGET_FINAL_WEIGHT)).toHaveLength(1);
  });
});
