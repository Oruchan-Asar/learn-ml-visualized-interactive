/**
 * Post-training isn't one algorithm -- it's a pipeline of stages, each one picking up where the
 * last left off. A pretrained base model can only continue text; SFT teaches it to follow
 * instructions at all; preference optimization (RLHF/DPO) polishes *which* of its instruction-
 * following answers people actually prefer; RLVR then pushes further on tasks where correctness
 * can be checked directly (math, code) instead of merely preferred.
 *
 * The numbers below are a hand-picked accuracy trace on one held-out benchmark, standing in for
 * whatever a real eval suite would report after each stage -- small enough to read off directly.
 */

export const BASE_ACCURACY = 0.15; // the raw pretrained model, before any post-training at all

export const STAGES = ["SFT", "Preference-optimized", "RLVR-tuned"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_ACCURACY: Record<Stage, number> = {
  SFT: 0.45,
  "Preference-optimized": 0.62,
  "RLVR-tuned": 0.81,
};

/** The benchmark accuracy immediately before a given stage runs -- the previous stage's output, or the base model for stage 0. */
export function accuracyBeforeStage(stageIndex: number): number {
  if (stageIndex <= 0) return BASE_ACCURACY;
  return STAGE_ACCURACY[STAGES[stageIndex - 1]];
}

/** How much accuracy one stage alone contributed -- its output minus whatever came in. */
export function stageGain(stageIndex: number): number {
  return STAGE_ACCURACY[STAGES[stageIndex]] - accuracyBeforeStage(stageIndex);
}

/** Every stage's own marginal contribution, in pipeline order. */
export function allStageGains(): number[] {
  return STAGES.map((_, i) => stageGain(i));
}

/** Total improvement across the whole pipeline, base model to final stage. */
export function totalGain(): number {
  return STAGE_ACCURACY[STAGES[STAGES.length - 1]] - BASE_ACCURACY;
}
