export interface Sample {
  x: number;
  y: number;
  weight: number;
}

export interface LocalFit {
  slope: number;
  intercept: number;
  samples: Sample[];
}

export const DOMAIN: [number, number] = [-1, 9];
export const RANGE_DOMAIN: [number, number] = [-2, 70];

/** The "black box" — LIME only ever queries this, never sees the formula behind it. */
export function blackBox(x: number): number {
  return x * x;
}

/** Fixed offsets LIME samples around any query point, and the Gaussian kernel width weighting them. */
export const OFFSETS: number[] = [-2, -1, 0, 1, 2];
export const SIGMA = 1.5;

export function kernelWeight(dx: number, sigma: number = SIGMA): number {
  return Math.exp(-(dx * dx) / (2 * sigma * sigma));
}

/** Perturbed samples around x0, each with its proximity weight — exactly what LIME feeds to its local regression. */
export function generateSamples(x0: number): Sample[] {
  return OFFSETS.map((dx) => ({ x: x0 + dx, y: blackBox(x0 + dx), weight: kernelWeight(dx) }));
}

/** Weighted least squares with one predictor — the simple, interpretable model LIME fits locally. */
export function weightedLinearFit(samples: Sample[]): { slope: number; intercept: number } {
  const totalWeight = samples.reduce((s, p) => s + p.weight, 0);
  const xBar = samples.reduce((s, p) => s + p.weight * p.x, 0) / totalWeight;
  const yBar = samples.reduce((s, p) => s + p.weight * p.y, 0) / totalWeight;
  const num = samples.reduce((s, p) => s + p.weight * (p.x - xBar) * (p.y - yBar), 0);
  const den = samples.reduce((s, p) => s + p.weight * (p.x - xBar) ** 2, 0);
  const slope = num / den;
  const intercept = yBar - slope * xBar;
  return { slope, intercept };
}

export function localFit(x0: number): LocalFit {
  const samples = generateSamples(x0);
  const { slope, intercept } = weightedLinearFit(samples);
  return { slope, intercept, samples };
}

/** A short line segment centered on x0, for plotting the local linear approximation. */
export function localLineSegment(x0: number, halfWidth = 1.5): { x: number; y: number }[] {
  const { slope, intercept } = localFit(x0);
  const x1 = x0 - halfWidth;
  const x2 = x0 + halfWidth;
  return [
    { x: x1, y: slope * x1 + intercept },
    { x: x2, y: slope * x2 + intercept },
  ];
}

/** The true derivative — never available to LIME itself, used here only to check the local fit against it. */
export function trueDerivative(x0: number): number {
  return 2 * x0;
}
