import { STATES, GOAL_STATE, transition, reward, isTerminal } from "./markov-decision-processes";
import { ACTIONS, initQTable, qUpdate, type QTable, type Action } from "./q-learning";

export { STATES, GOAL_STATE, ACTIONS, isTerminal };
export type { QTable, Action };

/** Every 3rd action is a forced exploration step (deterministic, not random) — otherwise act greedily
 * on the current Q-table, breaking ties toward "right." */
const EXPLORE_EVERY = 3;

function greedyAction(table: QTable, state: number): Action {
  return table[state].right >= table[state].left ? "right" : "left";
}

export interface TrainingStep {
  step: number;
  episode: number;
  state: number;
  action: Action;
  wasExploration: boolean;
  nextState: number;
  reward: number;
  qTable: QTable;
}

function cloneTable(table: QTable): QTable {
  return Object.fromEntries(STATES.map((s) => [s, { ...table[s] }])) as QTable;
}

export const NUM_EPISODES = 5;
export const MAX_STEPS_PER_EPISODE = 6;

/** Full Q-learning training: several episodes, each starting at state 0 and running until the goal
 * (or a step cap), acting epsilon-greedy on a fixed, reproducible explore/exploit schedule. */
export function trainAgent(): TrainingStep[] {
  const table = initQTable();
  const steps: TrainingStep[] = [];
  let globalStep = 0;

  for (let episode = 0; episode < NUM_EPISODES; episode++) {
    let state = 0;
    for (let t = 0; t < MAX_STEPS_PER_EPISODE && !isTerminal(state); t++) {
      const wasExploration = globalStep % EXPLORE_EVERY === EXPLORE_EVERY - 1;
      const action: Action = wasExploration ? "left" : greedyAction(table, state);

      const nextState = transition(state, action);
      const r = reward(nextState);
      table[state][action] = qUpdate(table, state, action, nextState, r);

      steps.push({ step: ++globalStep, episode, state, action, wasExploration, nextState, reward: r, qTable: cloneTable(table) });
      state = nextState;
    }
  }

  return steps;
}

/** The greedy policy read off the final, trained Q-table. */
export function greedyPolicy(table: QTable): Record<number, Action> {
  return Object.fromEntries(STATES.filter((s) => !isTerminal(s)).map((s) => [s, greedyAction(table, s)]));
}
