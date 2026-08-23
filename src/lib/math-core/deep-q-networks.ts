import { STATES, GOAL_STATE, GAMMA, transition, reward, isTerminal, type Action } from "./markov-decision-processes";
import { ACTION_SCRIPT } from "./q-learning";

export { STATES, GOAL_STATE, GAMMA, isTerminal, ACTION_SCRIPT };
export type { Action };

export const ACTIONS: Action[] = ["left", "right"];
export const LR = 0.05;

/**
 * A tiny "network": one hidden unit (a single ReLU) feeding two output units, one per action.
 * Just 6 numbers total — no matter how many states the world has, this network's size never
 * changes, unlike a Q-table's one-entry-per-state-per-action storage.
 */
export interface NetParams {
  wh: number;
  bh: number;
  wLeft: number;
  bLeft: number;
  wRight: number;
  bRight: number;
}

export const INIT_PARAMS: NetParams = { wh: 1, bh: 0, wLeft: -1, bLeft: 1, wRight: 1, bRight: -2 };

/** The hidden unit's activation for a given state — a single ReLU over one input feature. */
export function hidden(params: NetParams, state: number): number {
  return Math.max(0, params.wh * state + params.bh);
}

/** The network's own Q(s,a): its output layer applied to the hidden activation. */
export function qNet(params: NetParams, state: number, action: Action): number {
  const h = hidden(params, state);
  return action === "left" ? params.wLeft * h + params.bLeft : params.wRight * h + params.bRight;
}

export interface DqnUpdateResult {
  newParams: NetParams;
  tdError: number;
  loss: number;
}

/**
 * One gradient-descent step on the DQN squared TD-error loss L = (target - Q(s,a;theta))^2. The
 * target is bootstrapped off a separate, frozen `targetParams` network rather than the online
 * `params` being trained — the whole point of a target network: the thing being chased doesn't
 * move while a gradient step is being taken against it. Only the output weight/bias for the action
 * actually taken get updated (the hidden layer is held fixed here, exactly like only one Q-table
 * entry changes per Q-learning update).
 */
export function dqnUpdate(
  params: NetParams,
  state: number,
  action: Action,
  nextState: number,
  r: number,
  targetParams: NetParams,
): DqnUpdateResult {
  const h = hidden(params, state);
  const qPred = qNet(params, state, action);
  const targetMaxQ = isTerminal(nextState)
    ? 0
    : Math.max(qNet(targetParams, nextState, "left"), qNet(targetParams, nextState, "right"));
  const target = r + GAMMA * targetMaxQ;
  const tdError = target - qPred;
  const loss = tdError * tdError;

  const dLdW = -2 * tdError * h; // dQ/dw = h
  const dLdB = -2 * tdError * 1; // dQ/db = 1

  const newParams: NetParams = { ...params };
  if (action === "left") {
    newParams.wLeft = params.wLeft - LR * dLdW;
    newParams.bLeft = params.bLeft - LR * dLdB;
  } else {
    newParams.wRight = params.wRight - LR * dLdW;
    newParams.bRight = params.bRight - LR * dLdB;
  }

  return { newParams, tdError, loss };
}

export const TARGET_SYNC_EVERY = 3;

export interface DqnStep {
  step: number;
  state: number;
  action: Action;
  nextState: number;
  reward: number;
  params: NetParams;
  targetParams: NetParams;
  tdError: number;
  loss: number;
}

/**
 * Runs the same fixed action script Q-learning used, but training the tiny network instead of a
 * table: every step is one DQN gradient update, and the target network re-syncs to the online
 * network's weights every `TARGET_SYNC_EVERY` steps.
 */
export function runDqn(): DqnStep[] {
  let params: NetParams = { ...INIT_PARAMS };
  let targetParams: NetParams = { ...INIT_PARAMS };
  let state = 0;
  const steps: DqnStep[] = [];

  ACTION_SCRIPT.forEach((action, i) => {
    const nextState = transition(state, action);
    const r = reward(nextState);
    const { newParams, tdError, loss } = dqnUpdate(params, state, action, nextState, r, targetParams);
    params = newParams;

    steps.push({
      step: i + 1,
      state,
      action,
      nextState,
      reward: r,
      params: { ...params },
      targetParams: { ...targetParams },
      tdError,
      loss,
    });

    if ((i + 1) % TARGET_SYNC_EVERY === 0) targetParams = { ...params };
    state = isTerminal(nextState) ? 0 : nextState;
  });

  return steps;
}

/** A Q-table needs one entry per (state, action) pair — it grows linearly with the state count. */
export function tableSize(numStates: number): number {
  return numStates * ACTIONS.length;
}

/** The network's parameter count never changes, no matter how large the state space gets. */
export const NETWORK_PARAM_COUNT = 6;

export const SCALE_STATE_COUNTS = [4, 10, 100, 1000];
