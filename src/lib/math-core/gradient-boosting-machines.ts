export interface GbmPoint {
  x: number;
  y: number;
}

export interface Stump {
  threshold: number;
  leftValue: number;
  rightValue: number;
}

export interface BoostRound {
  stump: Stump;
  /** Total SSE left over after this round's stump — the exact quantity the split search minimized. */
  sse: number;
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function sumSquaredError(values: number[], target: number): number {
  return values.reduce((sum, v) => sum + (v - target) ** 2, 0);
}

/**
 * Finds the threshold (and each side's constant prediction, the group mean) that minimizes total SSE
 * when fitting `residuals` against `xs` with a single split — a regression-tree "stump".
 */
export function bestStump(xs: number[], residuals: number[]): Stump & { sse: number } {
  const sortedX = [...new Set(xs)].sort((a, b) => a - b);
  let best: (Stump & { sse: number }) | null = null;
  for (let i = 0; i < sortedX.length - 1; i++) {
    const threshold = (sortedX[i] + sortedX[i + 1]) / 2;
    const leftResiduals = residuals.filter((_, j) => xs[j] < threshold);
    const rightResiduals = residuals.filter((_, j) => xs[j] >= threshold);
    const leftValue = mean(leftResiduals);
    const rightValue = mean(rightResiduals);
    const totalSse = sumSquaredError(leftResiduals, leftValue) + sumSquaredError(rightResiduals, rightValue);
    if (!best || totalSse < best.sse) best = { threshold, leftValue, rightValue, sse: totalSse };
  }
  if (!best) throw new Error("Need at least two distinct x values to split on.");
  return best;
}

export function predictStump(stump: Stump, x: number): number {
  return x < stump.threshold ? stump.leftValue : stump.rightValue;
}

/** Runs plain (learning rate = 1) gradient boosting on squared-error loss for numRounds rounds. */
export function trainGbm(points: GbmPoint[], numRounds: number): { f0: number; rounds: BoostRound[] } {
  const xs = points.map((p) => p.x);
  const y = points.map((p) => p.y);
  const f0 = mean(y);
  let prediction = points.map(() => f0);
  const rounds: BoostRound[] = [];
  for (let r = 0; r < numRounds; r++) {
    const residuals = y.map((v, i) => v - prediction[i]);
    const { sse, ...stump } = bestStump(xs, residuals);
    prediction = xs.map((x, i) => prediction[i] + predictStump(stump, x));
    rounds.push({ stump, sse });
  }
  return { f0, rounds };
}

/** The ensemble's prediction using only the first numRounds stumps (0 = just F0). */
export function gbmPredict(f0: number, rounds: BoostRound[], numRounds: number, x: number): number {
  let value = f0;
  for (let i = 0; i < numRounds; i++) value += predictStump(rounds[i].stump, x);
  return value;
}

export function gbmResiduals(points: GbmPoint[], f0: number, rounds: BoostRound[], numRounds: number): number[] {
  return points.map((p) => p.y - gbmPredict(f0, rounds, numRounds, p.x));
}

export function totalSse(residuals: number[]): number {
  return residuals.reduce((sum, r) => sum + r * r, 0);
}

/** Dense samples of the ensemble's (piecewise-constant) prediction, for plotting as a curve. */
export function sampleGbmCurve(
  f0: number,
  rounds: BoostRound[],
  numRounds: number,
  domain: [number, number],
  resolution = 240,
): { x: number; y: number }[] {
  const [dMin, dMax] = domain;
  return Array.from({ length: resolution + 1 }, (_, i) => {
    const x = dMin + ((dMax - dMin) * i) / resolution;
    return { x, y: gbmPredict(f0, rounds, numRounds, x) };
  });
}

/**
 * Five points chosen so each round's best split is a large, unbiased margin over every runner-up
 * (verified by exhaustive search over all four candidate thresholds each round) — no ties, no ambiguity.
 */
export const GBM_POINTS: GbmPoint[] = [
  { x: 1, y: 1 },
  { x: 2, y: 2 },
  { x: 3, y: 8 },
  { x: 4, y: 9 },
  { x: 5, y: 13 },
];

export const MAX_GBM_ROUNDS = 2;
export const GBM_DOMAIN: [number, number] = [0, 6];
export const GBM_Y_DOMAIN: [number, number] = [-2, 15];

const trained = trainGbm(GBM_POINTS, MAX_GBM_ROUNDS);
export const GBM_F0 = trained.f0;
export const GBM_ROUNDS = trained.rounds;
