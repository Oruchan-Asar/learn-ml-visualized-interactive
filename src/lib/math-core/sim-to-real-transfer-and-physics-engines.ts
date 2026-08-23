/**
 * A policy tuned in simulation (MuJoCo/Isaac-style physics, but here just a clean proportional
 * controller) can fail on the real robot because the real actuator doesn't deliver the commanded motion
 * as faithfully as the simulator assumed — weaker torque, more friction, backlash. That gap is modeled
 * here with a single "friction" factor that scales how much of the commanded step the arm actually
 * takes. The controller error shrinks geometrically each step, so both the "does it succeed" question
 * and the "what gain closes the reality gap" question reduce to one exact formula.
 */

/** 1D reach: the end effector starts here and must reach TARGET. */
export const START = 0;
export const TARGET = 4;

/** Sim assumes the commanded motion is delivered exactly. */
export const SIM_FRICTION = 1.0;

/** The real actuator only delivers 60% of the commanded step per control cycle. */
export const REAL_FRICTION = 0.6;

/** The proportional gain the policy was tuned with in simulation. */
export const SIM_GAIN = 0.5;

/** Fixed number of control steps before checking whether the arm reached the target. */
export const STEPS = 4;

/** A run counts as a success if the final error is within this distance of the target. */
export const SUCCESS_TOLERANCE = 0.5;

/**
 * Proportional control step: commanded motion is gain * error, but only `friction` of it is actually
 * delivered. Because p_{t+1} - target = (1 - friction*gain)(p_t - target), the error after `steps`
 * steps is exactly (1 - friction*gain)^steps times the starting error — no simulation loop needed.
 */
export function finalError(gain: number, friction: number, steps: number = STEPS, start: number = START, target: number = TARGET): number {
  const decay = Math.abs(1 - friction * gain);
  return Math.abs(target - start) * decay ** steps;
}

export function finalPosition(gain: number, friction: number, steps: number = STEPS, start: number = START, target: number = TARGET): number {
  const sign = target >= start ? 1 : -1;
  return target - sign * finalError(gain, friction, steps, start, target);
}

export function succeeds(gain: number, friction: number, tolerance: number = SUCCESS_TOLERANCE): boolean {
  return finalError(gain, friction) <= tolerance;
}
