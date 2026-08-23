import { STATES, GOAL_STATE, GAMMA, transition, reward, isTerminal, type Action } from "./markov-decision-processes";

export { STATES, GOAL_STATE, GAMMA, isTerminal };
export type { Action };

export const ACTIONS: Action[] = ["left", "right"];

export type ValueTable = Record<number, number>;

/** One-step lookahead value of taking `action` from `state`, bootstrapped off value table V. */
function qValue(V: ValueTable, state: number, action: Action): number {
  const next = transition(state, action);
  return reward(next) + GAMMA * V[next];
}

export interface Backup {
  qLeft: number;
  qRight: number;
  bestAction: Action;
  value: number;
}

/** A single Bellman-optimality backup at one state: the max_a[...] update value iteration applies. */
export function bellmanBackup(V: ValueTable, state: number): Backup {
  const qLeft = qValue(V, state, "left");
  const qRight = qValue(V, state, "right");
  const bestAction: Action = qRight >= qLeft ? "right" : "left";
  return { qLeft, qRight, bestAction, value: Math.max(qLeft, qRight) };
}

/** Every non-terminal state starts with a value of exactly 0 — a deliberately wrong guess. */
export const INIT_V: ValueTable = Object.fromEntries(STATES.map((s) => [s, 0]));

export interface SweepStep {
  sweep: number;
  V: ValueTable;
  /** Whether any state's value changed by more than a hair during this sweep. */
  changed: boolean;
}

/**
 * Value iteration: repeatedly sweep every state, replacing its value with the Bellman-optimality
 * backup computed from the *previous* sweep's values (a synchronous update — every state in a sweep
 * sees the same snapshot of V). Keeps sweeping for `maxSweeps` rounds regardless of convergence, so
 * the demo can show the values settling into a fixed point.
 */
export function runValueIteration(maxSweeps = 5): SweepStep[] {
  let V: ValueTable = { ...INIT_V };
  const steps: SweepStep[] = [];

  for (let k = 1; k <= maxSweeps; k++) {
    const nextV: ValueTable = { ...V };
    let changed = false;
    for (const s of STATES) {
      if (isTerminal(s)) continue;
      const { value } = bellmanBackup(V, s);
      if (Math.abs(value - V[s]) > 1e-9) changed = true;
      nextV[s] = value;
    }
    V = nextV;
    steps.push({ sweep: k, V: { ...V }, changed });
  }

  return steps;
}

/** Extracts the greedy policy from a value table: the action maximizing the one-step lookahead. */
export function greedyPolicy(V: ValueTable, state: number): Action {
  return bellmanBackup(V, state).bestAction;
}

/**
 * Policy evaluation: compute V^pi exactly for a fixed policy by sweeping the Bellman *expectation*
 * equation (no max — just follow the policy) to a fixed point. Paired with greedy improvement, this
 * is the other half of dynamic programming: policy iteration alternates evaluating a policy and
 * then improving it, instead of directly iterating on values.
 */
export function evaluatePolicy(policy: (state: number) => Action, maxSweeps = 10): ValueTable {
  let V: ValueTable = { ...INIT_V };
  for (let k = 0; k < maxSweeps; k++) {
    const nextV: ValueTable = { ...V };
    for (const s of STATES) {
      if (isTerminal(s)) continue;
      nextV[s] = qValue(V, s, policy(s));
    }
    V = nextV;
  }
  return V;
}
