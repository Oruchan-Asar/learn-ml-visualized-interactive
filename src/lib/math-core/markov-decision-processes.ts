export type Action = "left" | "right";

/** A tiny 1D gridworld: states 0-3 in a row, state 3 is the goal (terminal). */
export const STATES = [0, 1, 2, 3];
export const GOAL_STATE = 3;
export const GAMMA = 0.9;

/** Deterministic transition: move one state in the chosen direction, clamped at the edges. */
export function transition(state: number, action: Action): number {
  const next = action === "right" ? state + 1 : state - 1;
  return Math.max(0, Math.min(STATES.length - 1, next));
}

/** +10 for reaching the goal, -1 for every other move (the cost of taking a step at all). */
export function reward(nextState: number): number {
  return nextState === GOAL_STATE ? 10 : -1;
}

export function isTerminal(state: number): boolean {
  return state === GOAL_STATE;
}

export type Policy = (state: number) => Action;

export const ALWAYS_RIGHT: Policy = () => "right";
export const ALWAYS_LEFT: Policy = () => "left";

/**
 * V^pi(s): the value of state s under a fixed policy. For "always right," the walk is acyclic
 * (state strictly increases until the goal), so the value is computed by backward substitution
 * from the terminal state — no iteration needed. For "always left" from any non-zero state, it
 * eventually gets stuck bouncing at the boundary (state 0), so its value is a closed-form
 * infinite geometric series instead.
 */
export function valueOfAlwaysRight(state: number): number {
  if (isTerminal(state)) return 0;
  const next = transition(state, "right");
  return reward(next) + GAMMA * valueOfAlwaysRight(next);
}

/** Value of being stuck forever at state 0 under "always left": V = -1 + gamma*V, solved in closed form. */
export function valueOfStuckAtZero(): number {
  return -1 / (1 - GAMMA);
}

/** Simulates a fixed policy for a fixed number of steps from a start state, returning the full trace. */
export interface TraceStep {
  state: number;
  action: Action;
  nextState: number;
  reward: number;
}

export function simulate(policy: Policy, startState: number, steps: number): TraceStep[] {
  const trace: TraceStep[] = [];
  let state = startState;
  for (let i = 0; i < steps; i++) {
    if (isTerminal(state)) break;
    const action = policy(state);
    const nextState = transition(state, action);
    trace.push({ state, action, nextState, reward: reward(nextState) });
    state = nextState;
  }
  return trace;
}

/** The discounted return of a trace: G = r_1 + gamma*r_2 + gamma^2*r_3 + ... */
export function discountedReturn(trace: TraceStep[]): number {
  return trace.reduce((sum, step, i) => sum + Math.pow(GAMMA, i) * step.reward, 0);
}
