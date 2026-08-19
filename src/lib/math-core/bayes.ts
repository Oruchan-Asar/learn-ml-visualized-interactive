export interface BayesInputs {
  /** P(A) — the base rate. */
  prior: number;
  /** P(B|A) — how often the test catches a true case. */
  sensitivity: number;
  /** P(B|not A) — how often the test fires on a non-case. */
  falsePositiveRate: number;
}

/** P(B) via the law of total probability. */
export function positiveRate({ prior, sensitivity, falsePositiveRate }: BayesInputs): number {
  return sensitivity * prior + falsePositiveRate * (1 - prior);
}

/** P(A|B) via Bayes' rule. */
export function posterior(inputs: BayesInputs): number {
  const pPositive = positiveRate(inputs);
  if (pPositive <= 0) return 0;
  return (inputs.sensitivity * inputs.prior) / pPositive;
}
