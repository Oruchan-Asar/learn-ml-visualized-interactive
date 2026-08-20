export interface Point2D {
  x: number;
  y: number;
}

/**
 * Two short chains of points, spaced 1 apart within each chain, plus one far-off point with no
 * neighbors at all. Chosen so integer distances make every neighbor check exact.
 */
export const DATA: Point2D[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 2, y: 0 },
  { x: 3, y: 0 },
  { x: 0, y: 5 },
  { x: 1, y: 5 },
  { x: 2, y: 5 },
  { x: 10, y: 10 },
];

export const EPS = 1.5;
export const MIN_NEIGHBORS = 1;
export const DOMAIN: [number, number] = [-1, 11];
export const NOISE = "noise" as const;

export function distance(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Every other point within eps of a given point — its neighborhood, not counting itself. */
export function neighborIndices(i: number, data: Point2D[] = DATA, eps: number = EPS): number[] {
  return data.map((_, j) => j).filter((j) => j !== i && distance(data[i], data[j]) <= eps);
}

export function isCore(i: number, data: Point2D[] = DATA, eps: number = EPS, minNeighbors: number = MIN_NEIGHBORS): boolean {
  return neighborIndices(i, data, eps).length >= minNeighbors;
}

export type ClusterLabel = number | typeof NOISE;

/** Standard DBSCAN: expand a new cluster from every unvisited core point via density-reachability;
 * anything never reached this way is noise. */
export function runDBSCAN(data: Point2D[] = DATA, eps: number = EPS, minNeighbors: number = MIN_NEIGHBORS): ClusterLabel[] {
  const labels: (ClusterLabel | undefined)[] = new Array(data.length).fill(undefined);
  let clusterId = 0;

  for (let i = 0; i < data.length; i++) {
    if (labels[i] !== undefined) continue;

    const seeds = neighborIndices(i, data, eps);
    if (seeds.length < minNeighbors) {
      labels[i] = NOISE;
      continue;
    }

    labels[i] = clusterId;
    const queue = [...seeds];
    while (queue.length > 0) {
      const j = queue.shift() as number;
      if (labels[j] === NOISE) labels[j] = clusterId;
      if (labels[j] !== undefined) continue;
      labels[j] = clusterId;
      const jNeighbors = neighborIndices(j, data, eps);
      if (jNeighbors.length >= minNeighbors) queue.push(...jNeighbors);
    }
    clusterId++;
  }

  return labels as ClusterLabel[];
}
