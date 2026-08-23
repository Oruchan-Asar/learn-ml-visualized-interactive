export interface Point2D {
  x: number;
  y: number;
}

/** Five points along a single feature axis, in two tight groups (0,1,2) and (6,7) — every pairwise
 * distance is a small integer, so every merge height below is exact. */
export const POINTS: Point2D[] = [
  { x: 0, y: 0 }, // A
  { x: 1, y: 0 }, // B
  { x: 2, y: 0 }, // C
  { x: 6, y: 0 }, // D
  { x: 7, y: 0 }, // E
];

export const LABELS = ["A", "B", "C", "D", "E"];
export const DOMAIN: [number, number] = [-1, 8];

export function distance(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Single-linkage distance between two clusters (given as index lists): the closest pair across them. */
export function singleLinkage(a: number[], b: number[], points: Point2D[]): number {
  let best = Infinity;
  for (const i of a) for (const j of b) best = Math.min(best, distance(points[i], points[j]));
  return best;
}

export interface MergeStep {
  /** The two clusters merged this step, each as its member indices, in cluster order (lower first-member index first). */
  merged: [number[], number[]];
  /** The single-linkage distance at which they merged. */
  height: number;
  /** All clusters that exist immediately *after* this merge. */
  clustersAfter: number[][];
}

/**
 * Runs single-linkage agglomerative clustering from n singleton clusters down to one. Ties are
 * broken deterministically: clusters are always compared in order of their smallest member index,
 * and the first minimal-distance pair found in that order is merged.
 */
export function runAgglomerative(points: Point2D[]): MergeStep[] {
  let clusters: number[][] = points.map((_, i) => [i]);
  const steps: MergeStep[] = [];

  while (clusters.length > 1) {
    let bestI = 0;
    let bestJ = 1;
    let bestDist = Infinity;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const d = singleLinkage(clusters[i], clusters[j], points);
        if (d < bestDist) {
          bestDist = d;
          bestI = i;
          bestJ = j;
        }
      }
    }
    const merged: [number[], number[]] = [clusters[bestI], clusters[bestJ]];
    const newCluster = [...clusters[bestI], ...clusters[bestJ]].sort((a, b) => a - b);
    clusters = [...clusters.filter((_, idx) => idx !== bestI && idx !== bestJ), newCluster];
    steps.push({ merged, height: bestDist, clustersAfter: clusters.map((c) => [...c]) });
  }

  return steps;
}

/** The clustering you'd get by "cutting" the dendrogram at a given height: every merge with a height
 * at or below the cut has happened, every merge above it hasn't. */
export function cutDendrogram(steps: MergeStep[], height: number): number[][] {
  const n = steps.reduce((max, s) => Math.max(max, ...s.merged.flat()), -1) + 1;
  let clusters: number[][] = Array.from({ length: n }, (_, i) => [i]);
  for (const step of steps) {
    if (step.height > height) break;
    clusters = step.clustersAfter.map((c) => [...c]);
  }
  return clusters;
}

export function clusterCountAtHeight(steps: MergeStep[], height: number): number {
  return cutDendrogram(steps, height).length;
}
