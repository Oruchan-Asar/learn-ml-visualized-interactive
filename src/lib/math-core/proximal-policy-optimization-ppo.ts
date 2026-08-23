export const EPSILON = 0.2;
export const ADVANTAGE = 1;
export const RATIO_DOMAIN: [number, number] = [0.4, 1.6];

/** Clamps the probability ratio r into [1-epsilon, 1+epsilon]. */
export function clip(r: number, epsilon: number = EPSILON): number {
  return Math.min(1 + epsilon, Math.max(1 - epsilon, r));
}

/** The plain policy-gradient surrogate objective: r * A, with no limit on how far r can move. */
export function unclippedObjective(r: number, advantage: number = ADVANTAGE): number {
  return r * advantage;
}

/** The clipped term alone: clip(r) * A. */
export function clippedTerm(r: number, advantage: number = ADVANTAGE, epsilon: number = EPSILON): number {
  return clip(r, epsilon) * advantage;
}

/** PPO's clipped surrogate objective: the pessimistic (lower) bound between the raw and clipped terms. */
export function clippedObjective(r: number, advantage: number = ADVANTAGE, epsilon: number = EPSILON): number {
  return Math.min(unclippedObjective(r, advantage), clippedTerm(r, advantage, epsilon));
}

/** Whether the clip is actively changing the objective at this ratio (i.e. it's the binding term). */
export function isClipActive(r: number, advantage: number = ADVANTAGE, epsilon: number = EPSILON): boolean {
  return Math.abs(clippedObjective(r, advantage, epsilon) - unclippedObjective(r, advantage)) > 1e-9;
}

export interface RatioCheck {
  r: number;
  unclipped: number;
  clipped: number;
  clipActive: boolean;
}

export function checkRatio(r: number, advantage: number = ADVANTAGE, epsilon: number = EPSILON): RatioCheck {
  return {
    r,
    unclipped: unclippedObjective(r, advantage),
    clipped: clippedObjective(r, advantage, epsilon),
    clipActive: isClipActive(r, advantage, epsilon),
  };
}

/** A fixed script of ratios walking from "moved a lot toward less likely" to "moved a lot toward more likely". */
export const RATIO_SCRIPT = [0.7, 0.9, 1.0, 1.1, 1.3, 1.5];

export function runRatioScript(): RatioCheck[] {
  return RATIO_SCRIPT.map((r) => checkRatio(r));
}
