export interface Point2D {
  x: number;
  y: number;
}

/**
 * Three well-separated blobs of 3 points each, all sharing the exact same shape
 * (offsets (0,0), (1,0), (0,1) from a blob "corner") so every blob contributes
 * identical inertia once correctly clustered — the arithmetic stays exact even
 * with a hand calculator.
 */
export const POINTS: Point2D[] = [
  { x: 0, y: 0 }, // A1
  { x: 1, y: 0 }, // A2
  { x: 0, y: 1 }, // A3
  { x: 10, y: 0 }, // B1
  { x: 11, y: 0 }, // B2
  { x: 10, y: 1 }, // B3
  { x: 5, y: 10 }, // C1
  { x: 6, y: 10 }, // C2
  { x: 5, y: 11 }, // C3
];

export const DOMAIN: [number, number] = [-1, 12];

/**
 * Fixed "random" draws used to pick each successive k-means++ centroid, standing in for a call to
 * a random number generator. Each draw is a number in [0,1) that lands somewhere in the cumulative
 * D(x)^2 distribution built from the centroids chosen so far. Fixing every draw at the midpoint,
 * 0.5, keeps the whole seeding process deterministic and reproducible by hand.
 */
export const RANDOM_DRAWS = [0.5, 0.5, 0.5];

export function squaredDistance(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/** D(x)^2 — the squared distance from x to its *nearest already-chosen* centroid. */
export function nearestSquaredDistances(points: Point2D[], centroids: Point2D[]): number[] {
  return points.map((p) => Math.min(...centroids.map((c) => squaredDistance(p, c))));
}

/**
 * Picks the next centroid by walking the cumulative D(x)^2 distribution (in point order) until it
 * passes `draw` (a fraction of the total weight) — points farther from every existing centroid are
 * proportionally more likely to land under the draw, but never guaranteed to.
 */
export function pickNextCentroidIndex(points: Point2D[], centroids: Point2D[], draw: number): number {
  const weights = nearestSquaredDistances(points, centroids);
  const total = weights.reduce((s, w) => s + w, 0);
  const threshold = draw * total;
  let cumulative = 0;
  for (let i = 0; i < points.length; i++) {
    cumulative += weights[i];
    if (cumulative > threshold) return i;
  }
  return points.length - 1;
}

/** k-means++ seeding: the first centroid is fixed to point 0 (real implementations pick it uniformly
 * at random too — fixed here so the rest of the arithmetic is reproducible), every subsequent one is
 * drawn D(x)^2-weighted via `pickNextCentroidIndex`. */
export function kmeansPlusPlusInit(points: Point2D[], k: number, draws: number[] = RANDOM_DRAWS): Point2D[] {
  const centroids: Point2D[] = [points[0]];
  for (let i = 1; i < k; i++) {
    const idx = pickNextCentroidIndex(points, centroids, draws[i - 1]);
    centroids.push(points[idx]);
  }
  return centroids;
}

export function assignClusters(points: Point2D[], centroids: Point2D[]): number[] {
  return points.map((p) => {
    let best = 0;
    let bestDist = Infinity;
    centroids.forEach((c, i) => {
      const d = squaredDistance(p, c);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  });
}

export function updateCentroids(points: Point2D[], assignments: number[], centroids: Point2D[]): Point2D[] {
  const sums = centroids.map(() => ({ x: 0, y: 0, n: 0 }));
  points.forEach((p, i) => {
    const s = sums[assignments[i]];
    s.x += p.x;
    s.y += p.y;
    s.n += 1;
  });
  return sums.map((s, i) => (s.n > 0 ? { x: s.x / s.n, y: s.y / s.n } : centroids[i]));
}

/** Runs Lloyd's algorithm from a given seed to convergence (or `maxIters`, whichever comes first). */
export function lloydConverge(
  points: Point2D[],
  initialCentroids: Point2D[],
  maxIters: number = 10,
): { assignments: number[]; centroids: Point2D[] } {
  let centroids = initialCentroids;
  let assignments = assignClusters(points, centroids);
  for (let i = 0; i < maxIters; i++) {
    const nextCentroids = updateCentroids(points, assignments, centroids);
    const nextAssignments = assignClusters(points, nextCentroids);
    const stable = nextAssignments.every((a, j) => a === assignments[j]);
    centroids = nextCentroids;
    assignments = nextAssignments;
    if (stable) break;
  }
  return { assignments, centroids };
}

/** Total inertia: sum of squared distances from every point to its assigned centroid. */
export function inertia(points: Point2D[], centroids: Point2D[], assignments: number[]): number {
  return points.reduce((sum, p, i) => sum + squaredDistance(p, centroids[assignments[i]]), 0);
}

/** Seeds with k-means++, runs Lloyd's to convergence, and reports the resulting inertia. */
export function inertiaForK(points: Point2D[], k: number, draws: number[] = RANDOM_DRAWS): number {
  const seed = kmeansPlusPlusInit(points, k, draws);
  const { assignments, centroids } = lloydConverge(points, seed);
  return inertia(points, centroids, assignments);
}

/** Inertia for every k in `ks`, in order — the raw material for an elbow plot. */
export function elbowCurve(points: Point2D[], ks: number[] = [1, 2, 3, 4]): number[] {
  return ks.map((k) => inertiaForK(points, k));
}

/**
 * Finds the "elbow": the k whose inertia drop (relative to k-1) is much larger than the next drop
 * (relative to k+1) — i.e. the k that maximizes how much the marginal improvement collapses right
 * after it. Requires at least 3 inertia values to have a k+1 to compare against.
 */
export function findElbowK(inertias: number[], ks: number[]): number {
  const drops = [];
  for (let i = 1; i < inertias.length; i++) drops.push(inertias[i - 1] - inertias[i]);
  let bestIdx = 0;
  let bestSecondDiff = -Infinity;
  for (let i = 0; i < drops.length - 1; i++) {
    const secondDiff = drops[i] - drops[i + 1];
    if (secondDiff > bestSecondDiff) {
      bestSecondDiff = secondDiff;
      bestIdx = i;
    }
  }
  // drops[i] is the drop from ks[i] to ks[i+1], so the elbow is at ks[i+1].
  return ks[bestIdx + 1];
}
