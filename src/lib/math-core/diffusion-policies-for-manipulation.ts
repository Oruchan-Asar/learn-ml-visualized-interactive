/**
 * A diffusion policy generates a robot's whole action trajectory at once, by denoising: start from pure
 * noise and, over a fixed number of steps, move toward a smooth trajectory the policy was trained to
 * produce. Real diffusion/flow-matching policies do this with a learned noise-prediction network; this
 * toy version replaces the network with the simplest possible deterministic denoiser — linear
 * interpolation between the noisy start and the clean target — so every intermediate step is exact and
 * hand-checkable, while still showing the same shape: noisy waypoints sliding toward a smooth path as
 * the step count climbs.
 */

export interface Point {
  x: number;
  y: number;
}

/** The clean, three-waypoint reaching trajectory the policy was "trained" to produce. */
export const CLEAN_TRAJECTORY: Point[] = [
  { x: 1, y: 3 },
  { x: 2, y: 2 },
  { x: 3, y: 0 },
];

/** Pure noise: a fixed, visibly scattered starting point for each waypoint (step 0 of denoising). */
export const NOISE_TRAJECTORY: Point[] = [
  { x: -2, y: -1 },
  { x: 3, y: -3 },
  { x: -1, y: 3 },
];

/** Total denoising steps from pure noise (t=0) to the clean trajectory (t=TOTAL_STEPS). */
export const TOTAL_STEPS = 4;

/** Linear interpolation between two points at fraction t (0 = a, 1 = b). */
export function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** The whole trajectory's waypoints at denoising step `step` out of `totalSteps`. */
export function waypointsAtStep(step: number, totalSteps: number = TOTAL_STEPS): Point[] {
  const t = step / totalSteps;
  return NOISE_TRAJECTORY.map((noise, i) => lerp(noise, CLEAN_TRAJECTORY[i], t));
}

function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Total distance of every waypoint from its clean target at a given step — the denoising error. */
export function errorAtStep(step: number, totalSteps: number = TOTAL_STEPS): number {
  const waypoints = waypointsAtStep(step, totalSteps);
  return waypoints.reduce((sum, w, i) => sum + distance(w, CLEAN_TRAJECTORY[i]), 0);
}

/** Checkpoint target: waypoint index 1 (the middle waypoint) at this unseen step. */
export const CHECKPOINT_STEP = 3;
export const CHECKPOINT_WAYPOINT_INDEX = 1;
