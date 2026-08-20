import { confusionMatrix, accuracy, precision, recall, f1Score, type ConfusionMatrix } from "./confusion-matrix-precision-recall-f1";
import { rocCurve, auc, type ScoredExample } from "./roc-curve-and-auc";
import { foldIndices } from "./cross-validation";

/**
 * One scored classifier, ten examples, five categories of scrutiny. Ordered so that a contiguous
 * 5-fold split (2 per fold) pairs each "easy" region together and each "confusing" region together —
 * exposing exactly where the classifier struggles, which the aggregate metrics below never show on their own.
 */
export const EXAMPLES: ScoredExample[] = [
  { label: 1, score: 0.9 },
  { label: 1, score: 0.8 },
  { label: 0, score: 0.7 },
  { label: 1, score: 0.65 },
  { label: 0, score: 0.6 },
  { label: 1, score: 0.55 },
  { label: 0, score: 0.4 },
  { label: 1, score: 0.3 },
  { label: 0, score: 0.2 },
  { label: 0, score: 0.1 },
];

export const DEFAULT_THRESHOLD = 0.5;

export function predictionsAt(threshold: number, examples: ScoredExample[] = EXAMPLES): number[] {
  return examples.map((e) => (e.score >= threshold ? 1 : 0));
}

export interface Metrics {
  cm: ConfusionMatrix;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
}

export function metricsAt(threshold: number, examples: ScoredExample[] = EXAMPLES): Metrics {
  const cm = confusionMatrix(
    examples.map((e) => e.label),
    predictionsAt(threshold, examples),
  );
  return { cm, accuracy: accuracy(cm), precision: precision(cm), recall: recall(cm), f1: f1Score(cm) };
}

export function rankingAUC(examples: ScoredExample[] = EXAMPLES): number {
  return auc(rocCurve(examples));
}

export interface FoldAccuracy {
  testIndices: number[];
  accuracy: number;
}

/** Break the fixed threshold's accuracy down fold by fold — same classifier, same threshold, no refitting. */
export function foldAccuracies(threshold: number = DEFAULT_THRESHOLD, examples: ScoredExample[] = EXAMPLES, k = 5): FoldAccuracy[] {
  const preds = predictionsAt(threshold, examples);
  return foldIndices(examples.length, k).map((testIndices) => {
    const cm = confusionMatrix(
      testIndices.map((i) => examples[i].label),
      testIndices.map((i) => preds[i]),
    );
    return { testIndices, accuracy: accuracy(cm) };
  });
}

/** Grid search over every threshold that could possibly change the prediction set, scored by F1. */
export function thresholdGridSearch(examples: ScoredExample[] = EXAMPLES): { threshold: number; f1: number }[] {
  const candidates = [Infinity, ...new Set(examples.map((e) => e.score))].sort((a, b) => b - a);
  return candidates.map((threshold) => ({ threshold, f1: metricsAt(threshold, examples).f1 }));
}

export function bestThreshold(examples: ScoredExample[] = EXAMPLES): { threshold: number; f1: number } {
  const results = thresholdGridSearch(examples);
  return results.reduce((best, r) => (r.f1 > best.f1 ? r : best), results[0]);
}
