import type { TreeRegion } from "./overfitting-tree";

export interface BoostPoint {
  x: number;
  label: string;
}

export interface Stump {
  threshold: number;
  leftLabel: string;
  rightLabel: string;
}

export interface BoostRound {
  stump: Stump;
  weightedError: number;
  alpha: number;
  /** The per-point weights that were active when this round's stump was chosen — the biggest ones are what it was trying to fix. */
  weightsBefore: number[];
  weightsAfter: number[];
}

function toSign(label: string): number {
  return label === "B" ? 1 : -1;
}

function stumpPredict(stump: Stump, x: number): string {
  return x < stump.threshold ? stump.leftLabel : stump.rightLabel;
}

function weightedError(points: BoostPoint[], weights: number[], stump: Stump): number {
  let err = 0;
  for (let i = 0; i < points.length; i++) {
    if (stumpPredict(stump, points[i].x) !== points[i].label) err += weights[i];
  }
  return err;
}

/** Tries every threshold in both polarities, keeping whichever minimizes weighted (not entropy-based) error. */
function bestStump(points: BoostPoint[], weights: number[]): Stump & { weightedError: number } {
  const xs = [...new Set(points.map((p) => p.x))].sort((a, b) => a - b);
  let best: (Stump & { weightedError: number }) | null = null;
  for (let i = 0; i < xs.length - 1; i++) {
    const threshold = (xs[i] + xs[i + 1]) / 2;
    for (const leftLabel of ["A", "B"]) {
      const rightLabel = leftLabel === "A" ? "B" : "A";
      const stump: Stump = { threshold, leftLabel, rightLabel };
      const err = weightedError(points, weights, stump);
      if (!best || err < best.weightedError) best = { ...stump, weightedError: err };
    }
  }
  if (!best) throw new Error("Need at least two distinct x values to split on.");
  return best;
}

/** Runs AdaBoost for numRounds rounds, returning each round's stump, weight, and the weights it left behind. */
export function trainBoosting(points: BoostPoint[], numRounds: number): BoostRound[] {
  const n = points.length;
  let weights = new Array(n).fill(1 / n);
  const rounds: BoostRound[] = [];
  for (let r = 0; r < numRounds; r++) {
    const weightsBefore = weights;
    const { weightedError: err, ...stump } = bestStump(points, weightsBefore);
    const epsilon = Math.min(Math.max(err, 1e-6), 1 - 1e-6);
    const alpha = 0.5 * Math.log((1 - epsilon) / epsilon);
    const updated = weightsBefore.map((w, i) => {
      const pred = stumpPredict(stump, points[i].x);
      return w * Math.exp(-alpha * toSign(points[i].label) * toSign(pred));
    });
    const total = updated.reduce((a, b) => a + b, 0);
    weights = updated.map((w) => w / total);
    rounds.push({ stump, weightedError: err, alpha, weightsBefore, weightsAfter: weights });
  }
  return rounds;
}

/** Weighted vote of the first numRounds stumps by their own alpha (confidence). */
export function ensemblePredict(rounds: BoostRound[], numRounds: number, x: number): string {
  let score = 0;
  for (let i = 0; i < numRounds; i++) {
    const { stump, alpha } = rounds[i];
    score += alpha * toSign(stumpPredict(stump, x));
  }
  return score >= 0 ? "B" : "A";
}

export function ensembleAccuracy(rounds: BoostRound[], numRounds: number, points: BoostPoint[]): number {
  return points.filter((p) => ensemblePredict(rounds, numRounds, p.x) === p.label).length / points.length;
}

function collectThreshold(rounds: BoostRound[], numRounds: number, out: number[]): void {
  for (let i = 0; i < numRounds; i++) out.push(rounds[i].stump.threshold);
}

/** The ensemble's combined step function through numRounds stumps, merged into contiguous same-prediction bands. */
export function boostRegions(
  rounds: BoostRound[],
  numRounds: number,
  domainMin: number,
  domainMax: number,
): TreeRegion[] {
  const cuts: number[] = [];
  collectThreshold(rounds, numRounds, cuts);
  const boundaries = [
    domainMin,
    ...[...new Set(cuts)].filter((c) => c > domainMin && c < domainMax).sort((a, b) => a - b),
    domainMax,
  ];

  const raw: TreeRegion[] = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const start = boundaries[i];
    const end = boundaries[i + 1];
    raw.push({ start, end, prediction: ensemblePredict(rounds, numRounds, (start + end) / 2) });
  }

  const merged: TreeRegion[] = [];
  for (const region of raw) {
    const last = merged[merged.length - 1];
    if (last && last.prediction === region.prediction) {
      last.end = region.end;
    } else {
      merged.push({ ...region });
    }
  }
  return merged;
}

/** Two disjoint "bumps" of class B — a single stump can capture at most one boundary well. */
function trueLabel(x: number): string {
  return (x >= 4 && x <= 7) || (x >= 12 && x <= 15) ? "B" : "A";
}

export const BOOST_POINTS: BoostPoint[] = Array.from({ length: 20 }, (_, x) => ({ x, label: trueLabel(x) }));

export const MAX_BOOST_ROUNDS = 5;
export const BOOST_DOMAIN: [number, number] = [-1, 20];
export const BOOST_ROUNDS: BoostRound[] = trainBoosting(BOOST_POINTS, MAX_BOOST_ROUNDS);
