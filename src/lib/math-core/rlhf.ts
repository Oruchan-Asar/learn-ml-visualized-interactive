import { ARMS, policy, policyGradientUpdate, THETA_INIT, type Arm, type Preferences } from "./policy-gradient-methods";

export { ARMS, policy, THETA_INIT };
export type { Arm, Preferences };

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** Three human preference comparisons: (winner, loser) pairs, nothing but "this one is better." */
export const COMPARISONS: [Arm, Arm][] = [
  ["B", "A"],
  ["B", "C"],
  ["C", "A"],
];

export const BETA = 0.5;

/**
 * Fits a Bradley-Terry reward score per response from pairwise preferences alone, by gradient descent
 * on the same cross-entropy loss as logistic regression: P(winner beats loser) = sigmoid(r_winner -
 * r_loser). Arm A is fixed at 0 as the reference point — Bradley-Terry rewards are only meaningful up
 * to a shared additive constant, exactly like softmax logits.
 */
export function rewardModelStep(rewards: Record<Arm, number>): Record<Arm, number> {
  const gradients: Record<Arm, number> = { A: 0, B: 0, C: 0 };
  for (const [winner, loser] of COMPARISONS) {
    const p = sigmoid(rewards[winner] - rewards[loser]);
    gradients[winner] += -(1 - p);
    gradients[loser] += 1 - p;
  }
  const next = { ...rewards };
  for (const arm of ARMS) {
    if (arm === "A") continue; // fixed reference
    next[arm] = rewards[arm] - BETA * gradients[arm];
  }
  return next;
}

export function fitRewardModel(steps: number): Record<Arm, number>[] {
  let rewards: Record<Arm, number> = { A: 0, B: 0, C: 0 };
  const trace: Record<Arm, number>[] = [{ ...rewards }];
  for (let i = 0; i < steps; i++) {
    rewards = rewardModelStep(rewards);
    trace.push({ ...rewards });
  }
  return trace;
}

export const REWARD_MODEL_STEPS = 3;

/**
 * Trains a policy using the FITTED reward model instead of any ground-truth reward — the actual
 * RLHF step. Runs one policy-gradient update per response, in order A, B, C, threading the same
 * theta through each (reusing Chapter 4's exact update rule).
 */
export function trainPolicyFromRewardModel(fittedRewards: Record<Arm, number>): { theta: Preferences; policyBefore: Record<Arm, number> } {
  const policyBefore = policy(THETA_INIT);
  let theta: Preferences = { ...THETA_INIT };
  for (const arm of ARMS) {
    theta = policyGradientUpdate(theta, arm, fittedRewards[arm]);
  }
  return { theta, policyBefore };
}
