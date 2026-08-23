/**
 * A model's stated confidence is only useful for catching hallucinations if it actually tracks whether
 * the answer is right. This chapter's seven toy predictions include one deliberately overconfident
 * hallucination — 0.70 confidence, wrong answer — sitting between two otherwise well-behaved clusters,
 * to make clear that "trust anything above a threshold" only works as well as the gap between those
 * clusters allows.
 */
export interface Prediction {
  label: string;
  /** The model's own stated probability that this prediction is correct. */
  confidence: number;
  /** Ground truth: was it actually right? */
  correct: boolean;
}

export const PREDICTIONS: Prediction[] = [
  { label: "capital of France", confidence: 0.95, correct: true },
  { label: "atomic number of gold", confidence: 0.9, correct: true },
  { label: "author of Hamlet", confidence: 0.85, correct: true },
  { label: "year the Berlin Wall fell", confidence: 0.7, correct: false },
  { label: "capital of Australia", confidence: 0.5, correct: false },
  { label: "speed of light, rounded", confidence: 0.35, correct: false },
  { label: "inventor of the telephone", confidence: 0.15, correct: false },
];

/** The trust rule: flag as trustworthy iff stated confidence clears the threshold. */
export function isTrusted(confidence: number, threshold: number): boolean {
  return confidence >= threshold;
}

/** Fraction of predictions where the trust/flag decision at this threshold matches the ground truth. */
export function separationAccuracy(threshold: number, predictions: Prediction[] = PREDICTIONS): number {
  const matches = predictions.filter((p) => isTrusted(p.confidence, threshold) === p.correct).length;
  return matches / predictions.length;
}
