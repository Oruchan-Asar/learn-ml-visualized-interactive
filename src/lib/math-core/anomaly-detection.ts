/** Five ordinary points clustered together, plus one far-off outlier. */
export const DATA: number[] = [1, 2, 3, 4, 5, 20];

export interface IsolationResult {
  value: number;
  depth: number;
}

/**
 * A deterministic isolation tree: at every node, split the current range at its exact midpoint
 * (a real isolation forest picks a random split point — here the split is fixed instead, so every
 * path length is exactly reproducible) and recurse on each half until every point is alone.
 */
export function isolate(points: number[], depth = 0): IsolationResult[] {
  if (points.length <= 1) {
    return points.map((value) => ({ value, depth }));
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const mid = (min + max) / 2;
  const left = points.filter((p) => p < mid);
  const right = points.filter((p) => p >= mid);
  return [...isolate(left, depth + 1), ...isolate(right, depth + 1)];
}

export function isolationDepths(data: number[] = DATA): Record<number, number> {
  const results = isolate(data);
  return Object.fromEntries(results.map((r) => [r.value, r.depth]));
}

/** The anomaly score: shorter isolation path = more anomalous. Normalized so 1 is "most anomalous here." */
export function anomalyScore(value: number, data: number[] = DATA): number {
  const depths = isolationDepths(data);
  const maxDepth = Math.max(...Object.values(depths));
  return 1 - depths[value] / (maxDepth + 1);
}
