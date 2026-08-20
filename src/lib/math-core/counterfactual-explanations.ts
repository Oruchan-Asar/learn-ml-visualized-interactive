export interface Point {
  x: number;
  y: number;
}

/** A linear classifier: approve when w·x + b >= 0. Weights (3, 4) give a clean ||w|| = 5. */
export const W: Point = { x: 3, y: 4 };
export const B = -20;
export const NORM = Math.hypot(W.x, W.y);

export const DOMAIN: [number, number] = [-2, 8];

export function decisionValue(x: number, y: number): number {
  return W.x * x + W.y * y + B;
}

/** Constant everywhere for a linear function — the fastest direction to increase the decision value. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for a uniform (x, y) => Point signature
export function gradient(x: number, y: number): Point {
  return { x: W.x, y: W.y };
}

export function isApproved(x: number, y: number): boolean {
  return decisionValue(x, y) >= 0;
}

/** How far (x, y) sits from the decision boundary, measured perpendicular to it. */
export function distanceToBoundary(x: number, y: number): number {
  return Math.abs(decisionValue(x, y)) / NORM;
}

/** The nearest point on the boundary itself — the smallest possible change that flips the decision. */
export function nearestCounterfactual(x: number, y: number): Point {
  const f = decisionValue(x, y);
  const scale = f / (NORM * NORM);
  return { x: x - scale * W.x, y: y - scale * W.y };
}

export const START_POINT: Point = { x: 0, y: 0 };
