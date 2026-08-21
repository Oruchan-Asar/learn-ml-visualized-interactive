export interface Point {
  label: string;
  x: number;
  y: number;
}

export const CENTROID_A = { x: 0, y: 0 };
export const CENTROID_B = { x: 10, y: 10 };

/** An 8-vector index, built once by assigning every point to its nearest centroid. */
export const POINTS: Point[] = [
  { label: "a1", x: 1, y: 1 },
  { label: "a2", x: 2, y: 0 },
  { label: "a3", x: 0, y: 3 },
  { label: "a4", x: 3, y: 2 },
  { label: "b1", x: 9, y: 9 },
  { label: "b2", x: 11, y: 10 },
  { label: "b3", x: 10, y: 12 },
  { label: "b4", x: 6, y: 6 },
];

export function squaredDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

export function nearestCentroid(point: { x: number; y: number }): "A" | "B" {
  return squaredDistance(point, CENTROID_A) <= squaredDistance(point, CENTROID_B) ? "A" : "B";
}

export function cluster(label: "A" | "B"): Point[] {
  return POINTS.filter((p) => nearestCentroid(p) === label);
}

export interface SearchResult {
  label: string;
  distance: number;
}

/** Exact search: compares the query against every indexed point. */
export function bruteForceNearest(query: { x: number; y: number }): SearchResult {
  let best: SearchResult | null = null;
  for (const p of POINTS) {
    const d = squaredDistance(query, p);
    if (!best || d < best.distance) best = { label: p.label, distance: d };
  }
  return best as SearchResult;
}

/** Approximate search: compares the query against the 2 centroids, then only the points in its assigned cluster. */
export function annNearest(query: { x: number; y: number }): SearchResult & { assigned: "A" | "B"; comparisons: number } {
  const assigned = nearestCentroid(query);
  const candidates = cluster(assigned);
  let best: SearchResult | null = null;
  for (const p of candidates) {
    const d = squaredDistance(query, p);
    if (!best || d < best.distance) best = { label: p.label, distance: d };
  }
  return { ...(best as SearchResult), assigned, comparisons: 2 + candidates.length };
}

export const TOTAL_POINTS = POINTS.length;

/** A query well inside cluster A's territory: the approximate search finds the exact same answer as brute force. */
export const QUERY_HIT = { x: 2, y: 2 };

/** A query near the cluster boundary: the approximate search misses the true nearest neighbor, which sits just across the boundary in the other cluster. */
export const QUERY_MISS = { x: 5, y: 4 };

/** A third, unseen boundary query for the checkpoint — another miss, with different exact numbers. */
export const QUERY_CHECKPOINT = { x: 4, y: 5 };

export const CHECKPOINT_CANDIDATES = ["a4", "b1", "b4", "b2"];
