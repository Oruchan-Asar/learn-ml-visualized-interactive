/** A point in the original (possibly high-dimensional) space — plain arrays so the same functions
 * work whether the input is 2D, 3D, or more (the capstone chapter reuses this on 3D customer data). */
export type Vector = number[];

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Five points tracing an L-shaped path — a 1D manifold bent through 2D space — with every
 * consecutive step exactly distance 1 apart, so nearest-neighbor distances and membership weights
 * come out to clean, hand-checkable values.
 */
export const MANIFOLD_POINTS: Vector[] = [
  [0, 0], // A
  [1, 0], // B
  [2, 0], // C
  [2, 1], // D
  [2, 2], // E
];

export const LABELS = ["A", "B", "C", "D", "E"];
export const K_NEIGHBORS = 2;

export function euclideanDistance(a: Vector, b: Vector): number {
  return Math.sqrt(a.reduce((sum, ai, idx) => sum + (ai - b[idx]) ** 2, 0));
}

/** The indices of the k nearest neighbors of point i (excluding itself), nearest first; ties broken
 * by index order. */
export function kNearestIndices(i: number, points: Vector[], k: number = K_NEIGHBORS): number[] {
  return points
    .map((_, j) => j)
    .filter((j) => j !== i)
    .sort((a, b) => euclideanDistance(points[i], points[a]) - euclideanDistance(points[i], points[b]) || a - b)
    .slice(0, k);
}

/** rho_i: the distance from i to its single nearest neighbor — UMAP's local connectivity radius,
 * guaranteeing every point is connected to at least its closest neighbor at full strength. */
export function localRadius(i: number, points: Vector[]): number {
  const [nearest] = kNearestIndices(i, points, 1);
  return euclideanDistance(points[i], points[nearest]);
}

/** Fixed bandwidth for every point, standing in for the per-point sigma real UMAP finds via a binary
 * search so each point's neighborhood carries a target amount of "effective" connectivity. Fixing it
 * keeps the arithmetic exact without changing the shape of the mechanism. */
export const SIGMA = 1;

/** The directed fuzzy membership strength of j in i's local neighborhood: full strength (1) at the
 * local radius, decaying exponentially beyond it, and exactly 0 outside the k nearest neighbors. */
export function directedMembership(i: number, j: number, points: Vector[], k: number = K_NEIGHBORS, sigma: number = SIGMA): number {
  const neighbors = kNearestIndices(i, points, k);
  if (!neighbors.includes(j)) return 0;
  const rho = localRadius(i, points);
  const d = euclideanDistance(points[i], points[j]);
  return Math.exp(-(d - rho) / sigma);
}

/** Symmetrizes via the fuzzy-set union: v_ij = v_{j|i} + v_{i|j} - v_{j|i} * v_{i|j} — a point counts
 * as a neighbor of an edge if either direction says so, rather than requiring both (a plain average
 * would). Returns the full n x n weight matrix. */
export function fuzzyGraph(points: Vector[], k: number = K_NEIGHBORS, sigma: number = SIGMA): number[][] {
  const n = points.length;
  const directed = points.map((_, i) => points.map((_, j) => (i === j ? 0 : directedMembership(i, j, points, k, sigma))));
  return directed.map((row, i) => row.map((vji, j) => (i === j ? 0 : vji + directed[j][i] - vji * directed[j][i])));
}

function squaredDistance2D(a: Point2D, b: Point2D): number {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

/**
 * One layout step: every edge with weight w pulls its two endpoints together proportionally to w
 * (attraction), while every pair of points pushes apart with a force that falls off with distance
 * (repulsion) — the same attract-along-edges / repel-everywhere-else mechanic as UMAP's real
 * optimizer, using a simpler force law so the numbers stay tractable by hand.
 */
export function layoutStep(positions: Point2D[], weights: number[][], learningRate: number, repulsionStrength: number = 1): Point2D[] {
  const n = positions.length;
  const forces = positions.map(() => ({ x: 0, y: 0 }));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const dx = positions[j].x - positions[i].x;
      const dy = positions[j].y - positions[i].y;
      const w = weights[i][j];
      if (w > 0) {
        // Attraction: pulls i toward j, proportional to edge weight.
        forces[i].x += w * dx;
        forces[i].y += w * dy;
      } else {
        // Repulsion: pushes i away from j, inverse to squared distance (capped to avoid blow-ups).
        const distSq = Math.max(squaredDistance2D(positions[i], positions[j]), 0.01);
        forces[i].x -= (repulsionStrength * dx) / distSq;
        forces[i].y -= (repulsionStrength * dy) / distSq;
      }
    }
  }

  return positions.map((p, i) => ({ x: p.x + learningRate * forces[i].x, y: p.y + learningRate * forces[i].y }));
}

export function runLayout(positions0: Point2D[], weights: number[][], steps: number, learningRate: number, repulsionStrength: number = 1): Point2D[] {
  let positions = positions0;
  for (let i = 0; i < steps; i++) positions = layoutStep(positions, weights, learningRate, repulsionStrength);
  return positions;
}

/** A fixed (not random) starting layout for the 5-point manifold example. */
export const INIT_LAYOUT: Point2D[] = [
  { x: 0.1, y: 0.05 },
  { x: -0.05, y: 0.1 },
  { x: 0.08, y: -0.08 },
  { x: -0.1, y: -0.03 },
  { x: 0.03, y: 0.09 },
];

export const LEARNING_RATE = 0.3;

export function distance2D(a: Point2D, b: Point2D): number {
  return Math.sqrt(squaredDistance2D(a, b));
}
