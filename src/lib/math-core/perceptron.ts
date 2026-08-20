export interface Vec2 {
  x: number;
  y: number;
}

export interface PerceptronPoint {
  x: number;
  y: number;
  label: string;
}

function sign(v: number): number {
  return v >= 0 ? 1 : -1;
}

function toPlusMinusOne(label: string): number {
  return label === "B" ? 1 : -1;
}

/** The perceptron's own prediction: sign(w . x + b). */
export function predict(w: Vec2, b: number, point: { x: number; y: number }): number {
  return sign(w.x * point.x + w.y * point.y + b);
}

export interface PerceptronState {
  w: Vec2;
  b: number;
}

/**
 * One perceptron update for a single point: if already correctly classified, nothing changes.
 * Otherwise w += lr * y * x, b += lr * y — nudging the boundary toward this point's true side.
 */
export function perceptronStep(state: PerceptronState, point: PerceptronPoint, learningRate: number): PerceptronState {
  const prediction = predict(state.w, state.b, point);
  const y = toPlusMinusOne(point.label);
  if (prediction === y) return state;
  return {
    w: { x: state.w.x + learningRate * y * point.x, y: state.w.y + learningRate * y * point.y },
    b: state.b + learningRate * y,
  };
}

/** The line w.x*x + w.y*y + b = 0, expressed as y-values at the domain's left/right x — degenerates to a flat placeholder when w.y = 0 (e.g. before any update has happened). */
export function lineEndpoints(
  w: Vec2,
  b: number,
  xDomain: [number, number],
  yDomain: [number, number],
): { yLeft: number; yRight: number } {
  const [xMin, xMax] = xDomain;
  if (w.y === 0) {
    const mid = (yDomain[0] + yDomain[1]) / 2;
    return { yLeft: mid, yRight: mid };
  }
  return {
    yLeft: -(w.x * xMin + b) / w.y,
    yRight: -(w.x * xMax + b) / w.y,
  };
}

/** Same two clusters as Chapter 11's SVM — max-margin found the *best* separator there; the perceptron just finds *a* separator here. */
export const PERCEPTRON_POINTS: PerceptronPoint[] = [
  { x: 3, y: 6, label: "A" },
  { x: 1, y: 7, label: "A" },
  { x: 6, y: 10, label: "A" },
  { x: 0, y: 9, label: "A" },
  { x: 5, y: 4, label: "B" },
  { x: 7, y: 2, label: "B" },
  { x: 8, y: 3, label: "B" },
  { x: 2, y: 0, label: "B" },
];

export const PERCEPTRON_X_DOMAIN: [number, number] = [0, 8];
export const PERCEPTRON_Y_DOMAIN: [number, number] = [0, 10];
export const LEARNING_RATE = 1;
