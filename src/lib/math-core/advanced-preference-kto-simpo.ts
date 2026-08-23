import { ARMS, policy, THETA_INIT, type Arm, type Preferences } from "./policy-gradient-methods";
import { COMPARISONS, BETA } from "./rlhf";

export { ARMS, policy, THETA_INIT, COMPARISONS, BETA };
export type { Arm, Preferences };

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

const REF_POLICY = policy(THETA_INIT); // uniform, since THETA_INIT is all zeros

// ---------------------------------------------------------------------------
// KTO -- drops PAIRING. Every DPO comparison "winner > loser" becomes two
// independent unpaired judgments: the winner is labeled desirable, the loser
// undesirable, with no record of which loser it beat or which winner beat it.
// ---------------------------------------------------------------------------

export interface KtoExample {
  arm: Arm;
  desirable: boolean;
}

/** DPO's 3 paired comparisons, relabeled as 6 independent desirable/undesirable judgments -- pairing information thrown away entirely. */
export const KTO_EXAMPLES: KtoExample[] = COMPARISONS.flatMap(([winner, loser]) => [
  { arm: winner, desirable: true },
  { arm: loser, desirable: false },
]);

export const KTO_LR = 0.5;

/**
 * KTO's per-example update: nudge just the ONE response named in this example, in the direction
 * its single desirable/undesirable label implies, measured against the reference policy. Unlike
 * DPO's dpoStep, no second response is touched in the same update -- there isn't one to touch.
 */
export function ktoStep(theta: Preferences, arm: Arm, desirable: boolean): Preferences {
  const pi = policy(theta);
  const logRatio = Math.log(pi[arm]) - Math.log(REF_POLICY[arm]);
  const sign = desirable ? 1 : -1;
  const z = sign * BETA * logRatio;
  const sig = sigmoid(z);
  const next: Preferences = { ...theta };
  next[arm] = theta[arm] + KTO_LR * (1 - sig) * BETA * sign;
  return next;
}

/** Runs one KTO update per example, in order, threading theta through each. */
export function fitKTO(steps: number = KTO_EXAMPLES.length): Preferences[] {
  let theta: Preferences = { ...THETA_INIT };
  const trace: Preferences[] = [{ ...theta }];
  for (let i = 0; i < steps; i++) {
    const { arm, desirable } = KTO_EXAMPLES[i % KTO_EXAMPLES.length];
    theta = ktoStep(theta, arm, desirable);
    trace.push({ ...theta });
  }
  return trace;
}

// ---------------------------------------------------------------------------
// SimPO -- drops the REFERENCE MODEL. The implicit reward is a response's own
// length-normalized log-probability, nothing subtracted from it, compared
// against a fixed target margin gamma instead of against zero.
// ---------------------------------------------------------------------------

/** Token lengths standing in for each response's length -- SimPO divides log-probability by this instead of comparing to a reference model. */
export const RESPONSE_LENGTHS: Record<Arm, number> = { A: 4, B: 2, C: 3 };

export const SIMPO_GAMMA = 0.3; // target reward margin the winner must clear over the loser
export const SIMPO_LR = 0.5;

/** SimPO's implicit reward for a response: beta times its OWN length-normalized log-probability -- no reference model anywhere in this formula. */
export function simpoReward(theta: Preferences, arm: Arm): number {
  return (BETA * Math.log(policy(theta)[arm])) / RESPONSE_LENGTHS[arm];
}

/** SimPO's per-pair update: same logistic shape as DPO, but on length-normalized rewards with no reference model, measured against target margin gamma instead of zero. */
export function simpoStep(theta: Preferences, winner: Arm, loser: Arm): Preferences {
  const rWinner = simpoReward(theta, winner);
  const rLoser = simpoReward(theta, loser);
  const sig = sigmoid(rWinner - rLoser - SIMPO_GAMMA);
  const next: Preferences = { ...theta };
  for (const a of ARMS) {
    const winnerTerm = a === winner ? 1 / RESPONSE_LENGTHS[winner] : 0;
    const loserTerm = a === loser ? 1 / RESPONSE_LENGTHS[loser] : 0;
    next[a] = theta[a] + SIMPO_LR * (1 - sig) * BETA * (winnerTerm - loserTerm);
  }
  return next;
}

/** Runs one SimPO update per comparison, in order, threading theta through each. */
export function fitSimPO(steps: number = COMPARISONS.length): Preferences[] {
  let theta: Preferences = { ...THETA_INIT };
  const trace: Preferences[] = [{ ...theta }];
  for (let i = 0; i < steps; i++) {
    const [winner, loser] = COMPARISONS[i % COMPARISONS.length];
    theta = simpoStep(theta, winner, loser);
    trace.push({ ...theta });
  }
  return trace;
}
