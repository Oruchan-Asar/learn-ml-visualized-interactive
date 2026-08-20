/** A deliberately imbalanced dataset: 9 negatives, 1 positive — a rare-event detection scenario. */
export const TRUE_LABELS: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1];

/** Always predicts negative — never wrong on the 9 easy cases, but misses the one that matters. */
export const DUMB_PREDICTIONS: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

/** Catches the rare positive, at the cost of one false alarm. */
export const SMART_PREDICTIONS: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1];

export interface ConfusionMatrix {
  truePositive: number;
  falsePositive: number;
  trueNegative: number;
  falseNegative: number;
}

export function confusionMatrix(trueLabels: number[], predictions: number[]): ConfusionMatrix {
  let truePositive = 0;
  let falsePositive = 0;
  let trueNegative = 0;
  let falseNegative = 0;
  trueLabels.forEach((actual, i) => {
    const pred = predictions[i];
    if (actual === 1 && pred === 1) truePositive++;
    else if (actual === 0 && pred === 1) falsePositive++;
    else if (actual === 0 && pred === 0) trueNegative++;
    else if (actual === 1 && pred === 0) falseNegative++;
  });
  return { truePositive, falsePositive, trueNegative, falseNegative };
}

export function accuracy(cm: ConfusionMatrix): number {
  const total = cm.truePositive + cm.falsePositive + cm.trueNegative + cm.falseNegative;
  return (cm.truePositive + cm.trueNegative) / total;
}

export function precision(cm: ConfusionMatrix): number {
  const predictedPositive = cm.truePositive + cm.falsePositive;
  return predictedPositive === 0 ? 0 : cm.truePositive / predictedPositive;
}

export function recall(cm: ConfusionMatrix): number {
  const actualPositive = cm.truePositive + cm.falseNegative;
  return actualPositive === 0 ? 0 : cm.truePositive / actualPositive;
}

export function f1Score(cm: ConfusionMatrix): number {
  const p = precision(cm);
  const r = recall(cm);
  return p + r === 0 ? 0 : (2 * p * r) / (p + r);
}
