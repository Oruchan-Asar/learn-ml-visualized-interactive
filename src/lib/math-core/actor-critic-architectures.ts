import { STATES, GOAL_STATE, GAMMA, transition, reward, isTerminal, type Action } from "./markov-decision-processes";

export { STATES, GOAL_STATE, GAMMA, isTerminal };
export type { Action };

export const ACTIONS: Action[] = ["left", "right"];
export const ALPHA_CRITIC = 0.5;
export const ALPHA_ACTOR = 0.5;

export type Preferences = Record<Action, number>;
export type ActorParams = Record<number, Preferences>;
export type Critic = Record<number, number>;

export function initActor(): ActorParams {
  return Object.fromEntries(STATES.map((s) => [s, { left: 0, right: 0 }])) as ActorParams;
}

export function initCritic(): Critic {
  return Object.fromEntries(STATES.map((s) => [s, 0])) as Critic;
}

/** The actor's policy at a state: a softmax over its per-state preferences. */
export function policyAt(theta: ActorParams, state: number): Record<Action, number> {
  const prefs = theta[state];
  const values = ACTIONS.map((a) => prefs[a]);
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - max));
  const sum = exps.reduce((s, v) => s + v, 0);
  return Object.fromEntries(ACTIONS.map((a, i) => [a, exps[i] / sum])) as Record<Action, number>;
}

function cloneCritic(V: Critic): Critic {
  return { ...V };
}

function cloneActor(theta: ActorParams): ActorParams {
  return Object.fromEntries(STATES.map((s) => [s, { ...theta[s] }])) as ActorParams;
}

export const ACTION_SCRIPT: Action[] = ["right", "right", "left", "right", "right", "right"];

export interface ActorCriticStep {
  step: number;
  state: number;
  action: Action;
  nextState: number;
  reward: number;
  /** The critic's TD error — used directly as the advantage driving the actor's update. */
  tdError: number;
  critic: Critic;
  actor: ActorParams;
}

/**
 * Runs the fixed action script through one-step actor-critic: the critic learns V(s) via ordinary
 * TD(0), and the same TD error doubles as the advantage that drives the actor's policy-gradient
 * update — exactly REINFORCE's (indicator - probability) shape, but scaled by a learned baseline
 * instead of the raw, noisy return.
 */
export function runActorCritic(): ActorCriticStep[] {
  let V = initCritic();
  let theta = initActor();
  let state = 0;
  const steps: ActorCriticStep[] = [];

  ACTION_SCRIPT.forEach((action, i) => {
    const nextState = transition(state, action);
    const r = reward(nextState);
    const vNext = isTerminal(nextState) ? 0 : V[nextState];
    const tdError = r + GAMMA * vNext - V[state];

    // Critic update: plain TD(0) for the state-value function.
    V = cloneCritic(V);
    V[state] = V[state] + ALPHA_CRITIC * tdError;

    // Actor update: nudge the taken action's preference by the critic's TD error.
    const pi = policyAt(theta, state);
    theta = cloneActor(theta);
    for (const a of ACTIONS) {
      const indicator = a === action ? 1 : 0;
      theta[state][a] = theta[state][a] + ALPHA_ACTOR * (indicator - pi[a]) * tdError;
    }

    steps.push({ step: i + 1, state, action, nextState, reward: r, tdError, critic: cloneCritic(V), actor: cloneActor(theta) });
    state = isTerminal(nextState) ? 0 : nextState;
  });

  return steps;
}
