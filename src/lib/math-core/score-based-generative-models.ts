/**
 * The "score" of a distribution is the gradient of its log-density, ∇ₓ log p(x) — a vector field that
 * points toward wherever probability is higher. Follow it uphill, repeatedly, and a point starting
 * anywhere drifts toward the data's mode. Real score-based models also inject noise at every step
 * (Langevin dynamics) so the result samples the *whole* distribution instead of collapsing onto its
 * single peak; this chapter's deterministic version isolates the "follow the gradient uphill" half of
 * that story, which is exact and hand-computable.
 */
export const MU = 3;
export const SIGMA = 1;
export const STEP_SIZE = 0.3;

/** The score of a Gaussian N(mu, sigma²): d/dx log p(x) = -(x-mu)/sigma² — always points toward the mean. */
export function score(x: number, mu: number = MU, sigma: number = SIGMA): number {
  return (mu - x) / (sigma * sigma);
}

/** One step of gradient ascent on the log-density: x moves a little further uphill, toward the mode. */
export function langevinStep(x: number, stepSize: number = STEP_SIZE): number {
  return x + stepSize * score(x);
}

/** Runs `steps` updates starting from x0, keeping every intermediate point. */
export function runTrajectory(x0: number, steps: number, stepSize: number = STEP_SIZE): number[] {
  const trajectory = [x0];
  let x = x0;
  for (let i = 0; i < steps; i++) {
    x = langevinStep(x, stepSize);
    trajectory.push(x);
  }
  return trajectory;
}

/** Each step multiplies the distance to the mode by exactly this factor — a closed form for how fast the trajectory converges. */
export const DECAY_FACTOR = 1 - STEP_SIZE / (SIGMA * SIGMA);

/** The exact distance from the mode after `steps` updates, in closed form — no simulation needed. */
export function distanceToModeAfter(x0: number, steps: number, mu: number = MU): number {
  return Math.abs(x0 - mu) * DECAY_FACTOR ** steps;
}

export const START_X = -5;
export const CHECKPOINT_STEPS = [2, 4, 6, 8, 10];
