/** Four coin flips, 3 heads (1) and 1 tail (0) — the same style of toy dataset as the MLE chapter, smaller so the prior's pull is visible. */
export const FLIPS: number[] = [1, 1, 1, 0];

/** A Beta(alpha, beta) prior encoded as pseudo-counts: "alpha - 1" imagined extra heads, "beta - 1" imagined extra tails. */
export const PRIOR_ALPHA = 2;
export const PRIOR_BETA = 4;

export function headsCount(flips: number[] = FLIPS): number {
  return flips.reduce((sum, f) => sum + f, 0);
}

/** The MLE ignores the prior entirely: just the observed proportion of heads. */
export function mleEstimate(flips: number[] = FLIPS): number {
  return headsCount(flips) / flips.length;
}

/** The prior's own mean, alpha / (alpha + beta) — what you'd believe with zero data. */
export function priorMean(alpha: number = PRIOR_ALPHA, beta: number = PRIOR_BETA): number {
  return alpha / (alpha + beta);
}

/** Data log-likelihood: k*ln(p) + (n-k)*ln(1-p). */
export function logLikelihood(p: number, flips: number[] = FLIPS): number {
  const n = flips.length;
  const k = headsCount(flips);
  return k * Math.log(p) + (n - k) * Math.log(1 - p);
}

/** Unnormalized log-prior density from the Beta(alpha, beta) pseudo-counts: (alpha-1)*ln(p) + (beta-1)*ln(1-p). */
export function logPrior(p: number, alpha: number = PRIOR_ALPHA, beta: number = PRIOR_BETA): number {
  return (alpha - 1) * Math.log(p) + (beta - 1) * Math.log(1 - p);
}

/** Unnormalized log-posterior = log-likelihood + log-prior (the normalizing constant doesn't move the peak). */
export function logPosterior(p: number, flips: number[] = FLIPS, alpha: number = PRIOR_ALPHA, beta: number = PRIOR_BETA): number {
  return logLikelihood(p, flips) + logPrior(p, alpha, beta);
}

/** Closed-form MAP estimate: the mode of the Beta(k+alpha, n-k+beta) posterior, (k+alpha-1)/(n+alpha+beta-2). */
export function mapEstimate(flips: number[] = FLIPS, alpha: number = PRIOR_ALPHA, beta: number = PRIOR_BETA): number {
  const n = flips.length;
  const k = headsCount(flips);
  return (k + alpha - 1) / (n + alpha + beta - 2);
}
