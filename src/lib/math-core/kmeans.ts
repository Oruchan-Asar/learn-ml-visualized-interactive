export interface ClusterDataPoint {
  x: number;
  y: number;
}

function distanceSquared(a: ClusterDataPoint, b: ClusterDataPoint): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/** Assigns each point to the index of its nearest centroid. */
export function assignClusters(points: ClusterDataPoint[], centroids: ClusterDataPoint[]): number[] {
  return points.map((p) => {
    let best = 0;
    let bestDist = Infinity;
    centroids.forEach((c, i) => {
      const d = distanceSquared(p, c);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  });
}

/** Moves each centroid to the mean of the points currently assigned to it; unchanged if none are assigned. */
export function updateCentroids(
  points: ClusterDataPoint[],
  assignments: number[],
  centroids: ClusterDataPoint[],
): ClusterDataPoint[] {
  const sums = centroids.map(() => ({ x: 0, y: 0, n: 0 }));
  points.forEach((p, i) => {
    const s = sums[assignments[i]];
    s.x += p.x;
    s.y += p.y;
    s.n += 1;
  });
  return sums.map((s, i) => (s.n > 0 ? { x: s.x / s.n, y: s.y / s.n } : centroids[i]));
}

/** One full k-means iteration: assign every point, then move each centroid to its cluster's mean. */
export function kMeansStep(
  points: ClusterDataPoint[],
  centroids: ClusterDataPoint[],
): { assignments: number[]; centroids: ClusterDataPoint[] } {
  const assignments = assignClusters(points, centroids);
  return { assignments, centroids: updateCentroids(points, assignments, centroids) };
}

/** Two well-separated blobs of 6 points each. */
export const CLUSTER_POINTS: ClusterDataPoint[] = [
  { x: 1, y: 1 },
  { x: 2, y: 1 },
  { x: 1, y: 2 },
  { x: 2, y: 2 },
  { x: 1.5, y: 1.5 },
  { x: 2.5, y: 2 },
  { x: 8, y: 7 },
  { x: 9, y: 7 },
  { x: 8, y: 8 },
  { x: 9, y: 8 },
  { x: 8.5, y: 7.5 },
  { x: 9.5, y: 8 },
];

export const CLUSTER_DOMAIN: [number, number] = [0, 10];

/** Deliberately bad start — both centroids sit in empty space, on the *opposite* blob from where they'll end up. */
export const INITIAL_CENTROIDS: ClusterDataPoint[] = [
  { x: 9, y: 1 },
  { x: 1, y: 8 },
];
