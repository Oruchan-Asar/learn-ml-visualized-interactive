export interface LabeledPoint2D {
  x: number;
  y: number;
  label: string;
}

/**
 * Two clusters, A (bottom-left) and B (top-right) — plus one deliberately noisy A point planted
 * right inside B's territory, so a small k can be fooled by it while a larger k isn't.
 */
export const DATA: LabeledPoint2D[] = [
  { x: 1, y: 1, label: "A" },
  { x: 1, y: 2, label: "A" },
  { x: 2, y: 1, label: "A" },
  { x: 2, y: 2, label: "A" },
  { x: 4.2, y: 4.3, label: "A" },
  { x: 4, y: 4, label: "B" },
  { x: 4, y: 5.2, label: "B" },
  { x: 5, y: 4, label: "B" },
  { x: 5, y: 5, label: "B" },
];

export const QUERY = { x: 4, y: 4.5 };
export const DOMAIN: [number, number] = [0, 6];

export function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export interface RankedPoint {
  point: LabeledPoint2D;
  d: number;
}

/** Every data point ranked by distance to the query, nearest first. */
export function rankByDistance(query: { x: number; y: number }, data: LabeledPoint2D[] = DATA): RankedPoint[] {
  return data.map((point) => ({ point, d: distance(query, point) })).sort((a, b) => a.d - b.d);
}

export function kNearestNeighbors(query: { x: number; y: number }, k: number, data: LabeledPoint2D[] = DATA): RankedPoint[] {
  return rankByDistance(query, data).slice(0, k);
}

/** Majority vote among the k nearest neighbors — ties broken by the single closest point's label. */
export function predict(query: { x: number; y: number }, k: number, data: LabeledPoint2D[] = DATA): string {
  const neighbors = kNearestNeighbors(query, k, data);
  const counts = new Map<string, number>();
  for (const { point } of neighbors) counts.set(point.label, (counts.get(point.label) ?? 0) + 1);
  const maxCount = Math.max(...counts.values());
  const tied = [...counts.entries()].filter(([, c]) => c === maxCount).map(([label]) => label);
  if (tied.length === 1) return tied[0];
  return neighbors[0].point.label;
}

export function voteCounts(query: { x: number; y: number }, k: number, data: LabeledPoint2D[] = DATA): Record<string, number> {
  const neighbors = kNearestNeighbors(query, k, data);
  const counts: Record<string, number> = {};
  for (const { point } of neighbors) counts[point.label] = (counts[point.label] ?? 0) + 1;
  return counts;
}
