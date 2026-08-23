/**
 * Generative 3D models (text-to-3D, image-to-3D) rarely produce a clean mesh in one shot. A common
 * pattern: generate a coarse point cloud, then refine it over several steps until it matches the target
 * shape closely enough to mesh. "Closely enough" needs a metric — Chamfer distance, the standard way to
 * score how well one point set matches another:
 *
 *   chamfer(A, B) = mean_{a in A} min_{b in B} dist(a, b)  +  mean_{b in B} min_{a in A} dist(b, a)
 *
 * It's symmetric and penalizes both "predicted points far from any real surface point" and "real surface
 * points nothing predicted is near" — a predicted cloud that's merely a subset of the target, or that
 * bunches everything in one spot, still scores badly on the term it's neglecting.
 *
 * Once a point cloud (or an implicit density field) is good enough, turning it into an actual mesh means
 * finding the *surface* — the zero level set. On a 1D slice through a density field, that's just finding
 * where consecutive samples cross zero and linearly interpolating the crossing (the core idea behind
 * marching cubes' 1D building block).
 */

export interface Point2D {
  x: number;
  y: number;
}

export function distance(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function nearestDistance(p: Point2D, set: Point2D[]): number {
  return Math.min(...set.map((q) => distance(p, q)));
}

/** Symmetric nearest-neighbor distance between two point sets. */
export function chamferDistance(a: Point2D[], b: Point2D[]): number {
  const aToB = a.reduce((sum, p) => sum + nearestDistance(p, b), 0) / a.length;
  const bToA = b.reduce((sum, p) => sum + nearestDistance(p, a), 0) / b.length;
  return aToB + bToA;
}

// A small square's 4 corners is the ground-truth shape being reconstructed.
export const TARGET_SHAPE: Point2D[] = [
  { x: 0, y: 0 },
  { x: 2, y: 0 },
  { x: 2, y: 2 },
  { x: 0, y: 2 },
];

// A generative model's coarse first guess: every point collapsed onto the shape's centroid.
export const COARSE_GUESS: Point2D[] = [
  { x: 1, y: 1 },
  { x: 1, y: 1 },
  { x: 1, y: 1 },
  { x: 1, y: 1 },
];

// A 3-step refinement trace: coarse -> halfway -> exact.
export const REFINEMENT_STEPS: Point2D[][] = [
  COARSE_GUESS,
  [
    { x: 0.5, y: 0.5 },
    { x: 1.5, y: 0.5 },
    { x: 1.5, y: 1.5 },
    { x: 0.5, y: 1.5 },
  ],
  TARGET_SHAPE,
];

/** Chamfer distance at each refinement step, against the fixed target shape. */
export function refinementTrace(steps: Point2D[][] = REFINEMENT_STEPS, target: Point2D[] = TARGET_SHAPE): number[] {
  return steps.map((s) => chamferDistance(s, target));
}

function lerpPoint(a: Point2D, b: Point2D, t: number): Point2D {
  return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
}

/** Continuous refinement "slider": t=0 is the coarse collapsed guess, t=1 is the exact target. */
export function refinementAt(t: number, coarse: Point2D[] = COARSE_GUESS, target: Point2D[] = TARGET_SHAPE): Point2D[] {
  return coarse.map((p, i) => lerpPoint(p, target[i], t));
}

export function chamferAt(t: number, coarse: Point2D[] = COARSE_GUESS, target: Point2D[] = TARGET_SHAPE): number {
  return chamferDistance(refinementAt(t, coarse, target), target);
}

// --- Implicit field -> mesh: locating a zero crossing (marching cubes' core 1D step) ---

/** Linearly interpolate where a sampled field crosses zero between two adjacent samples. Assumes d0
 * and d1 have opposite signs (the surface passes between them). */
export function findZeroCrossing(x0: number, d0: number, x1: number, d1: number): number {
  const t = -d0 / (d1 - d0);
  return x0 + t * (x1 - x0);
}

// A 1D density profile sampled at x = 0, 1, 2, 3 — negative is "outside", positive is "inside".
export const DENSITY_PROFILE: { x: number; d: number }[] = [
  { x: 0, d: -1 },
  { x: 1, d: -0.2 },
  { x: 2, d: 0.6 },
  { x: 3, d: 1.5 },
];

// Checkpoint: drag the refinement slider t until Chamfer distance drops to this.
export const CHECKPOINT_TARGET_CHAMFER = 0.5;
export const CHECKPOINT_TOLERANCE = 0.1;
