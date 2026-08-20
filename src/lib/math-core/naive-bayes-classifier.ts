export type Label = "spam" | "not spam";

export interface TrainingMessage {
  label: Label;
  words: string[];
}

export const VOCAB = ["free", "money", "meeting"] as const;
export type Word = (typeof VOCAB)[number];

/** Six labeled training messages, engineered so "free" never once appears in a "not spam" message —
 * a real zero-frequency problem that smoothing exists specifically to fix. */
export const TRAINING: TrainingMessage[] = [
  { label: "spam", words: ["free", "money"] },
  { label: "spam", words: ["free"] },
  { label: "spam", words: ["money"] },
  { label: "not spam", words: ["meeting"] },
  { label: "not spam", words: ["meeting", "money"] },
  { label: "not spam", words: [] },
];

export const LABELS: Label[] = ["spam", "not spam"];
export const NEW_MESSAGE: string[] = ["free", "money"];

function messagesOfClass(label: Label): TrainingMessage[] {
  return TRAINING.filter((m) => m.label === label);
}

export function classCount(label: Label): number {
  return messagesOfClass(label).length;
}

export function prior(label: Label): number {
  return classCount(label) / TRAINING.length;
}

function wordCountInClass(word: Word, label: Label): number {
  return messagesOfClass(label).filter((m) => m.words.includes(word)).length;
}

/** Raw maximum-likelihood estimate — no smoothing. Zero training examples means exactly zero probability. */
export function likelihoodRaw(word: Word, label: Label): number {
  return wordCountInClass(word, label) / classCount(label);
}

/** Laplace (add-1) smoothing for a binary feature: pretend one extra present and one extra absent example. */
export function likelihoodSmoothed(word: Word, label: Label, alpha = 1): number {
  return (wordCountInClass(word, label) + alpha) / (classCount(label) + alpha * 2);
}

/** P(message | label), assuming every word's presence/absence is conditionally independent given the label. */
function messageLikelihood(message: string[], label: Label, smoothed: boolean): number {
  return VOCAB.reduce((prob, word) => {
    const p = smoothed ? likelihoodSmoothed(word, label) : likelihoodRaw(word, label);
    return prob * (message.includes(word) ? p : 1 - p);
  }, 1);
}

export interface ClassificationResult {
  posteriors: Record<Label, number>;
  prediction: Label;
}

/** Full naive Bayes classification: unnormalized posterior per class, normalized to sum to 1. */
export function classify(message: string[], smoothed: boolean): ClassificationResult {
  const unnormalized = Object.fromEntries(
    LABELS.map((label) => [label, prior(label) * messageLikelihood(message, label, smoothed)]),
  ) as Record<Label, number>;
  const total = LABELS.reduce((s, l) => s + unnormalized[l], 0);
  const posteriors = Object.fromEntries(
    LABELS.map((label) => [label, total > 0 ? unnormalized[label] / total : 0]),
  ) as Record<Label, number>;
  const prediction = LABELS.reduce((best, l) => (posteriors[l] > posteriors[best] ? l : best));
  return { posteriors, prediction };
}
