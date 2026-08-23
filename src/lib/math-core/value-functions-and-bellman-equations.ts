import {
  STATES,
  GOAL_STATE,
  GAMMA,
  transition,
  reward,
  isTerminal,
  valueOfAlwaysRight,
  type Action,
} from "./markov-decision-processes";

export { STATES, GOAL_STATE, GAMMA, isTerminal };
export type { Action };

export const ACTIONS: Action[] = ["left", "right"];

/**
 * The optimal value function V*(s): the best possible expected discounted return from s, under
 * whichever policy is best. In this MDP, "always right" already reaches the goal by the most
 * direct route possible from every state, so its (already-known) value function IS the optimal
 * one — reused rather than recomputed.
 */
export function vStar(state: number): number {
  return valueOfAlwaysRight(state);
}

/**
 * The optimal action-value function Q*(s,a): take action a once, then behave optimally (per V*)
 * from whatever state that lands in. This is a one-step lookahead built directly on top of V*.
 */
export function qStar(state: number, action: Action): number {
  const next = transition(state, action);
  return reward(next) + GAMMA * vStar(next);
}

export interface BellmanCheck {
  state: number;
  qLeft: number;
  qRight: number;
  bestAction: Action;
  maxQ: number;
  vStarValue: number;
  /** Whether max_a Q*(s,a) exactly reproduces V*(s) — the Bellman optimality equation holding. */
  matches: boolean;
}

/** Checks the Bellman optimality equation at one state: V*(s) should equal max_a Q*(s,a). */
export function checkBellmanOptimality(state: number): BellmanCheck {
  if (isTerminal(state)) {
    return { state, qLeft: 0, qRight: 0, bestAction: "right", maxQ: 0, vStarValue: 0, matches: true };
  }
  const qLeft = qStar(state, "left");
  const qRight = qStar(state, "right");
  const bestAction: Action = qRight >= qLeft ? "right" : "left";
  const maxQ = Math.max(qLeft, qRight);
  const vStarValue = vStar(state);
  const matches = Math.abs(maxQ - vStarValue) < 1e-9;
  return { state, qLeft, qRight, bestAction, maxQ, vStarValue, matches };
}

/** Runs the Bellman-optimality consistency check across every state, in order. */
export function runBellmanChecks(): BellmanCheck[] {
  return STATES.map((s) => checkBellmanOptimality(s));
}
