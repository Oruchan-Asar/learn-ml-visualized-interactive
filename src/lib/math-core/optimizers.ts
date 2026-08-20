import { f, gradient, type Vec2 } from "@/lib/math-core/momentum";

export { f, gradient };

export interface MomentumOptState {
  point: Vec2;
  velocity: Vec2;
}
export interface RmspropState {
  point: Vec2;
  sq: Vec2;
}
export interface AdamState {
  point: Vec2;
  m: Vec2;
  v: Vec2;
  t: number;
}

export const START: Vec2 = { x: 4, y: 1 };
export const LR_MOMENTUM = 0.05;
export const BETA_MOMENTUM = 0.85;
export const LR_RMSPROP = 0.3;
export const BETA_RMSPROP = 0.9;
export const LR_ADAM = 0.3;
export const BETA1_ADAM = 0.9;
export const BETA2_ADAM = 0.999;
export const EPS = 1e-8;

export function momentumStep(state: MomentumOptState): MomentumOptState {
  const g = gradient(state.point.x, state.point.y);
  const velocity = {
    x: BETA_MOMENTUM * state.velocity.x + g.x,
    y: BETA_MOMENTUM * state.velocity.y + g.y,
  };
  return {
    point: { x: state.point.x - LR_MOMENTUM * velocity.x, y: state.point.y - LR_MOMENTUM * velocity.y },
    velocity,
  };
}

export function rmspropStep(state: RmspropState): RmspropState {
  const g = gradient(state.point.x, state.point.y);
  const sq = {
    x: BETA_RMSPROP * state.sq.x + (1 - BETA_RMSPROP) * g.x * g.x,
    y: BETA_RMSPROP * state.sq.y + (1 - BETA_RMSPROP) * g.y * g.y,
  };
  return {
    point: {
      x: state.point.x - (LR_RMSPROP * g.x) / (Math.sqrt(sq.x) + EPS),
      y: state.point.y - (LR_RMSPROP * g.y) / (Math.sqrt(sq.y) + EPS),
    },
    sq,
  };
}

export function adamStep(state: AdamState): AdamState {
  const g = gradient(state.point.x, state.point.y);
  const t = state.t + 1;
  const m = { x: BETA1_ADAM * state.m.x + (1 - BETA1_ADAM) * g.x, y: BETA1_ADAM * state.m.y + (1 - BETA1_ADAM) * g.y };
  const v = {
    x: BETA2_ADAM * state.v.x + (1 - BETA2_ADAM) * g.x * g.x,
    y: BETA2_ADAM * state.v.y + (1 - BETA2_ADAM) * g.y * g.y,
  };
  const mHat = { x: m.x / (1 - BETA1_ADAM ** t), y: m.y / (1 - BETA1_ADAM ** t) };
  const vHat = { x: v.x / (1 - BETA2_ADAM ** t), y: v.y / (1 - BETA2_ADAM ** t) };
  return {
    point: {
      x: state.point.x - (LR_ADAM * mHat.x) / (Math.sqrt(vHat.x) + EPS),
      y: state.point.y - (LR_ADAM * mHat.y) / (Math.sqrt(vHat.y) + EPS),
    },
    m,
    v,
    t,
  };
}

export const INITIAL_MOMENTUM_STATE: MomentumOptState = { point: START, velocity: { x: 0, y: 0 } };
export const INITIAL_RMSPROP_STATE: RmspropState = { point: START, sq: { x: 0, y: 0 } };
export const INITIAL_ADAM_STATE: AdamState = { point: START, m: { x: 0, y: 0 }, v: { x: 0, y: 0 }, t: 0 };

export const RACE_DOMAIN: [number, number] = [-4.5, 4.5];
export const TARGET_DISTANCE = 0.2;
export const TARGET_STEPS = 15;

function distance(p: Vec2): number {
  return Math.hypot(p.x, p.y);
}

export { distance };
