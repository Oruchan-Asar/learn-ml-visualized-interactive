import { ARMS, ARM_REWARDS, pullArm, type Arm } from "./multi-armed-bandits";

export { ARMS, ARM_REWARDS, pullArm };
export type { Arm };

export const ALPHA = 0.5;

export type Preferences = Record<Arm, number>;

export const THETA_INIT: Preferences = { A: 0, B: 0, C: 0 };

/** The policy itself: a softmax over preference parameters, one per arm. */
export function policy(theta: Preferences): Record<Arm, number> {
  const values = ARMS.map((a) => theta[a]);
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - max));
  const sum = exps.reduce((s, v) => s + v, 0);
  return Object.fromEntries(ARMS.map((a, i) => [a, exps[i] / sum])) as Record<Arm, number>;
}

/**
 * The REINFORCE update for a softmax policy: nudge the chosen action's preference up (and every
 * other action's preference down) by how much the return exceeded what the policy expected — the
 * exact same (indicator - probability) gradient shape as softmax cross-entropy in Part III,
 * reweighted by the return instead of a fixed target of 1.
 */
export function policyGradientUpdate(theta: Preferences, chosenArm: Arm, returnG: number): Preferences {
  const pi = policy(theta);
  const next: Preferences = { ...theta };
  for (const a of ARMS) {
    const indicator = a === chosenArm ? 1 : 0;
    next[a] = theta[a] + ALPHA * (indicator - pi[a]) * returnG;
  }
  return next;
}

export const ACTION_SCRIPT: Arm[] = ["A", "B", "C", "B", "B"];

export interface PgStep {
  step: number;
  arm: Arm;
  reward: number;
  policyBefore: Record<Arm, number>;
  thetaBefore: Preferences;
  thetaAfter: Preferences;
}

/** Runs the fixed 5-pull script through REINFORCE, updating the policy's preferences after each pull. */
export function runPolicyGradient(): PgStep[] {
  let theta = { ...THETA_INIT };
  const pullCount: Record<Arm, number> = { A: 0, B: 0, C: 0 };
  const steps: PgStep[] = [];

  ACTION_SCRIPT.forEach((arm, i) => {
    const policyBefore = policy(theta);
    const reward = pullArm(arm, pullCount[arm]);
    pullCount[arm]++;
    const thetaAfter = policyGradientUpdate(theta, arm, reward);
    steps.push({ step: i + 1, arm, reward, policyBefore, thetaBefore: theta, thetaAfter });
    theta = thetaAfter;
  });

  return steps;
}
