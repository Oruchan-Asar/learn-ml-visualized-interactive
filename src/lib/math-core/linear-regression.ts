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
