/** A tiny joint distribution over two paired variables X and Y — five outcomes, clean fractional probabilities. */
export interface Outcome {
  x: number;
  y: number;
  p: number;
}

export const OUTCOMES: Outcome[] = [
  { x: 1, y: 2, p: 0.1 },
  { x: 2, y: 1, p: 0.3 },
  { x: 3, y: 4, p: 0.2 },
  { x: 4, y: 3, p: 0.3 },
  { x: 5, y: 5, p: 0.1 },
];

export type Key = "x" | "y";

/** E[X] or E[Y] — sum of each outcome's value weighted by its probability. */
export function mean(outcomes: Outcome[], key: Key): number {
  return outcomes.reduce((sum, o) => sum + o.p * o[key], 0);
}

/** Var(X) = E[(X - E[X])^2], accumulated directly rather than via E[X^2] - E[X]^2 to stay numerically exact. */
export function variance(outcomes: Outcome[], key: Key): number {
  const m = mean(outcomes, key);
  return outcomes.reduce((sum, o) => sum + o.p * (o[key] - m) ** 2, 0);
}

/** Cov(X, Y) = E[(X - E[X])(Y - E[Y])]. */
export function covariance(outcomes: Outcome[]): number {
  const mx = mean(outcomes, "x");
  const my = mean(outcomes, "y");
  return outcomes.reduce((sum, o) => sum + o.p * (o.x - mx) * (o.y - my), 0);
}

export interface Contribution {
  label: string;
  value: number;
}

/** Per-outcome terms p_i * value_i that sum to the mean — for a live bar-chart breakdown. */
export function meanContributions(outcomes: Outcome[], key: Key): Contribution[] {
  return outcomes.map((o) => ({ label: `${key}=${o[key]}`, value: o.p * o[key] }));
}

/** Per-outcome terms p_i * (value_i - mean)^2 that sum to the variance. */
export function varianceContributions(outcomes: Outcome[], key: Key): Contribution[] {
  const m = mean(outcomes, key);
  return outcomes.map((o) => ({ label: `${key}=${o[key]}`, value: o.p * (o[key] - m) ** 2 }));
}

/** Per-outcome terms p_i * (x_i - E[X])(y_i - E[Y]) that sum to the covariance. */
export function covarianceContributions(outcomes: Outcome[]): Contribution[] {
  const mx = mean(outcomes, "x");
  const my = mean(outcomes, "y");
  return outcomes.map((o) => ({
    label: `(${o.x}, ${o.y})`,
    value: o.p * (o.x - mx) * (o.y - my),
  }));
}
