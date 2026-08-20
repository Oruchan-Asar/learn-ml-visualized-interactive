export interface ScoredExample {
  label: 0 | 1;
  score: number;
}

/** 3 positives, 3 negatives — imperfectly separated (one positive scores lower than one negative). */
export const EXAMPLES: ScoredExample[] = [
  { label: 1, score: 0.9 },
  { label: 1, score: 0.7 },
  { label: 0, score: 0.6 },
  { label: 1, score: 0.4 },
  { label: 0, score: 0.3 },
  { label: 0, score: 0.1 },
];

export interface RocPoint {
  threshold: number;
  fpr: number;
  tpr: number;
}

/** Sweeps every observed score as a decision threshold, computing (FPR, TPR) at each — the ROC curve. */
export function rocCurve(examples: ScoredExample[] = EXAMPLES): RocPoint[] {
  const positives = examples.filter((e) => e.label === 1).length;
  const negatives = examples.filter((e) => e.label === 0).length;
  const thresholds = [Infinity, ...[...new Set(examples.map((e) => e.score))].sort((a, b) => b - a)];

  return thresholds.map((threshold) => {
    const predictedPositive = examples.filter((e) => e.score >= threshold);
    const tp = predictedPositive.filter((e) => e.label === 1).length;
    const fp = predictedPositive.filter((e) => e.label === 0).length;
    return { threshold, tpr: tp / positives, fpr: fp / negatives };
  });
}

/** Area under the ROC curve, via the trapezoidal rule over points sorted by increasing FPR. */
export function auc(points: RocPoint[] = rocCurve()): number {
  const sorted = [...points].sort((a, b) => a.fpr - b.fpr || a.tpr - b.tpr);
  let area = 0;
  for (let i = 1; i < sorted.length; i++) {
    const dx = sorted[i].fpr - sorted[i - 1].fpr;
    const avgHeight = (sorted[i].tpr + sorted[i - 1].tpr) / 2;
    area += dx * avgHeight;
  }
  return area;
}

/** Accuracy at a single fixed threshold — for contrast with the threshold-independent AUC. */
export function accuracyAtThreshold(threshold: number, examples: ScoredExample[] = EXAMPLES): number {
  const correct = examples.filter((e) => (e.score >= threshold ? 1 : 0) === e.label).length;
  return correct / examples.length;
}
