import { ARMS, policy, THETA_INIT, type Arm, type Preferences } from "./policy-gradient-methods";
import { COMPARISONS, BETA } from "./rlhf";

export { ARMS, policy, THETA_INIT, COMPARISONS, BETA };
export type { Arm, Preferences };

export const DPO_LR = 0.5;

const REF_POLICY = policy(THETA_INIT); // uniform, since THETA_INIT is all zeros

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * DPO substitutes the closed-form relationship between an optimal policy and a Bradley-Terry reward
 * — r(y) = β·log(π(y)/π_ref(y)) + const — directly into the preference loss, so the reward model
 * disappears algebraically. What's left is a plain logistic loss on the policy's own log-probabilities.
 * Differentiating it, the softmax's own π(a) term cancels exactly between the winner and loser
 * derivatives, leaving an update even simpler than RLHF's two-stage version: no reward model to fit
 * first, no separate policy-gradient rule — one gradient step per preference pair, directly on theta.
 */
export function dpoStep(theta: Preferences, winner: Arm, loser: Arm): Preferences {
  const pi = policy(theta);
  const logRatioWinner = Math.log(pi[winner]) - Math.log(REF_POLICY[winner]);
  const logRatioLoser = Math.log(pi[loser]) - Math.log(REF_POLICY[loser]);
  const h = BETA * (logRatioWinner - logRatioLoser);
  const sig = sigmoid(h);
  const next: Preferences = { ...theta };
  for (const a of ARMS) {
    const indicatorWinner = a === winner ? 1 : 0;
    const indicatorLoser = a === loser ? 1 : 0;
    next[a] = theta[a] + DPO_LR * (1 - sig) * BETA * (indicatorWinner - indicatorLoser);
  }
  return next;
}

/** Runs one DPO gradient step per comparison, in order, threading theta through each — the entire training loop. */
export function fitDPO(steps: number = COMPARISONS.length): Preferences[] {
  let theta: Preferences = { ...THETA_INIT };
  const trace: Preferences[] = [{ ...theta }];
  for (let i = 0; i < steps; i++) {
    const [winner, loser] = COMPARISONS[i % COMPARISONS.length];
    theta = dpoStep(theta, winner, loser);
    trace.push({ ...theta });
  }
  return trace;
}
