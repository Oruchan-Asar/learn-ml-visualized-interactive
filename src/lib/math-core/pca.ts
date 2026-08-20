export interface Point2D {
  x: number;
  y: number;
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Variance of each point's scalar projection onto the (not-necessarily-unit) direction (dx,dy). */
export function projectedVariance(points: Point2D[], dx: number, dy: number): number {
  const norm = Math.hypot(dx, dy);
  if (norm === 0) return 0;
  const ux = dx / norm;
  const uy = dy / norm;
  const projections = points.map((p) => p.x * ux + p.y * uy);
  const m = mean(projections);
  return mean(projections.map((proj) => (proj - m) ** 2));
}

/** Each point's projection scalar times the unit direction — where that point "lands" on the direction line. */
export function projectedPoints(points: Point2D[], dx: number, dy: number): Point2D[] {
  const norm = Math.hypot(dx, dy);
  if (norm === 0) return points.map(() => ({ x: 0, y: 0 }));
  const ux = dx / norm;
  const uy = dy / norm;
  return points.map((p) => {
    const proj = p.x * ux + p.y * uy;
    return { x: proj * ux, y: proj * uy };
  });
}

/**
 * Seven points built as a*(0.6,0.8) + b*(-0.8,0.6) for hand-chosen (a,b) with sum(a*b)=0 —
 * mean is exactly (0,0), and the true maximum-variance direction is exactly (0.6, 0.8).
 */
export const PCA_POINTS: Point2D[] = [
  { x: -2.6, y: -1.8 },
  { x: -0.4, y: -2.2 },
  { x: -0.6, y: -0.8 },
  { x: 0, y: 0 },
  { x: 0.6, y: 0.8 },
  { x: 2, y: 1 },
  { x: 1, y: 3 },
];

export const PCA_DOMAIN: [number, number] = [-4, 4];

/** The true principal direction (unit vector) and its variance, by construction. */
export const TRUE_DIRECTION: Point2D = { x: 0.6, y: 0.8 };
export const MAX_VARIANCE = projectedVariance(PCA_POINTS, TRUE_DIRECTION.x, TRUE_DIRECTION.y);
