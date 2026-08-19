export interface Point {
  x: number;
  y: number;
}

/** A small dataset that roughly follows y ≈ 2x + 1, with some noise. */
export const DATA_POINTS: Point[] = [
  { x: 1, y: 3.5 },
  { x: 3, y: 6.8 },
  { x: 5, y: 10.5 },
  { x: 7, y: 15.2 },
  { x: 9, y: 18.5 },
];

/** The same dataset, plus one dramatic outlier at (2, 20) — the rest still trend near y ≈ 2x + 1. */
export const OUTLIER_DATA_POINTS: Point[] = [...DATA_POINTS, { x: 2, y: 20 }];

export function predict(w: number, b: number, x: number): number {
  return w * x + b;
}

/** Total squared residual across every point — what a line fit is minimizing. */
export function sumSquaredError(points: Point[], w: number, b: number): number {
  return points.reduce((sum, p) => {
    const residual = p.y - predict(w, b, p.x);
    return sum + residual * residual;
  }, 0);
}

export function meanSquaredError(points: Point[], w: number, b: number): number {
  return sumSquaredError(points, w, b) / points.length;
}

/** Total absolute residual across every point — grows linearly with a miss, unlike SSE. */
export function sumAbsoluteError(points: Point[], w: number, b: number): number {
  return points.reduce((sum, p) => sum + Math.abs(p.y - predict(w, b, p.x)), 0);
}

export function meanAbsoluteError(points: Point[], w: number, b: number): number {
  return sumAbsoluteError(points, w, b) / points.length;
}
