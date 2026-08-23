/** Toy Bayesian spam classifier: 3 words, 2 classes, presence/absence naive Bayes with an MLE/MAP toggle. */
export type Label = "spam" | "not spam";
export type Estimator = "mle" | "map";

export interface TrainingMessage {
  label: Label;
  words: string[];
}

export const VOCAB = ["win", "urgent", "link"] as const;
export type Word = (typeof VOCAB)[number];

/** Six labeled messages, engineered so both "urgent" and "link" are entirely absent from one class each —
 * a double zero-frequency problem that makes MLE break and MAP (Laplace) smoothing rescue it. */
export const TRAINING: TrainingMessage[] = [
  { label: "spam", words: ["win", "urgent"] },
  { label: "spam", words: ["win"] },
  { label: "spam", words: ["urgent"] },
  { label: "not spam", words: ["link"] },
  { label: "not spam", words: ["link", "win"] },
  { label: "not spam", words: [] },
];

export const LABELS: Label[] = ["spam", "not spam"];
export const NEW_MESSAGE: string[] = ["urgent", "link"];

function messagesOfClass(label: Label): TrainingMessage[] {
  return TRAINING.filter((m) => m.label === label);
}

export function classCount(label: Label): number {
  return messagesOfClass(label).length;
}

/** P(label), estimated from the fraction of training messages in that class. */
export function prior(label: Label): number {
  return classCount(label) / TRAINING.length;
}

function wordCountInClass(word: Word, label: Label): number {
  return messagesOfClass(label).filter((m) => m.words.includes(word)).length;
}

/** Raw MLE: count / total, with no smoothing. Zero co-occurring examples means exactly zero probability. */
export function likelihoodMLE(word: Word, label: Label): number {
  return wordCountInClass(word, label) / classCount(label);
}

/** MAP under a Beta(alpha+1, alpha+1) prior on each word, i.e. Laplace/add-alpha smoothing. */
export function likelihoodMAP(word: Word, label: Label, alpha = 1): number {
  return (wordCountInClass(word, label) + alpha) / (classCount(label) + alpha * 2);
}

function likelihoodFor(word: Word, label: Label, estimator: Estimator): number {
  return estimator === "map" ? likelihoodMAP(word, label) : likelihoodMLE(word, label);
}

/** P(message | label) under the naive (conditional-independence) assumption across every vocab word. */
export function messageLikelihood(message: string[], label: Label, estimator: Estimator): number {
  return VOCAB.reduce((prob, word) => {
    const p = likelihoodFor(word, label, estimator);
    return prob * (message.includes(word) ? p : 1 - p);
  }, 1);
}

export interface ClassificationResult {
  likelihoods: Record<Label, number>;
  posteriors: Record<Label, number>;
  prediction: Label | null;
}

/** Full Bayesian classification: P(label) * P(message | label), normalized across labels via Bayes' rule. */
export function classify(message: string[], estimator: Estimator): ClassificationResult {
  const likelihoods = Object.fromEntries(
    LABELS.map((label) => [label, messageLikelihood(message, label, estimator)]),
  ) as Record<Label, number>;
  const unnormalized = Object.fromEntries(
    LABELS.map((label) => [label, prior(label) * likelihoods[label]]),
  ) as Record<Label, number>;
  const total = LABELS.reduce((s, l) => s + unnormalized[l], 0);
  const posteriors = Object.fromEntries(
    LABELS.map((label) => [label, total > 0 ? unnormalized[label] / total : 0]),
  ) as Record<Label, number>;
  const prediction = total > 0 ? LABELS.reduce((best, l) => (posteriors[l] > posteriors[best] ? l : best)) : null;
  return { likelihoods, posteriors, prediction };
}
