import { STATES, GOAL_STATE, GAMMA, transition, reward, isTerminal, type Action } from "./markov-decision-processes";

export { STATES, GOAL_STATE, GAMMA, isTerminal };
export type { Action };

export const ACTIONS: Action[] = ["left", "right"];
export const ALPHA = 0.5;

export type QTable = Record<number, Record<Action, number>>;

export function initQTable(): QTable {
  const table: QTable = {};
  for (const s of STATES) table[s] = { left: 0, right: 0 };
  return table;
}

/** Best action-value available from a state — 0 for the terminal state, since no action follows it. */
export function maxQ(table: QTable, state: number): number {
  if (isTerminal(state)) return 0;
  return Math.max(table[state].left, table[state].right);
}

/** The Q-learning update rule: Q(s,a) += alpha * (r + gamma*maxQ(s') - Q(s,a)). */
export function qUpdate(table: QTable, state: number, action: Action, nextState: number, r: number): number {
  const current = table[state][action];
  const target = r + GAMMA * maxQ(table, nextState);
  return current + ALPHA * (target - current);
}

/** A fixed action script, deterministic, resetting to state 0 whenever the goal is reached. */
export const ACTION_SCRIPT: Action[] = ["right", "right", "left", "right", "right", "right"];

export interface QStep {
  step: number;
  state: number;
  action: Action;
  nextState: number;
  reward: number;
  qTable: QTable;
}

function cloneTable(table: QTable): QTable {
  return { ...Object.fromEntries(STATES.map((s) => [s, { ...table[s] }])) };
}

/** Runs the fixed action script through Q-learning, updating the table one step at a time. */
export function runQLearning(): QStep[] {
  const table = initQTable();
  let state = 0;
  const steps: QStep[] = [];

  ACTION_SCRIPT.forEach((action, i) => {
    const nextState = transition(state, action);
    const r = reward(nextState);
    const newQ = qUpdate(table, state, action, nextState, r);
    table[state][action] = newQ;

    steps.push({ step: i + 1, state, action, nextState, reward: r, qTable: cloneTable(table) });

    state = isTerminal(nextState) ? 0 : nextState;
  });

  return steps;
}
