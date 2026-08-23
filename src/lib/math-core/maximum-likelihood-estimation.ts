/** Five coin flips, 4 heads (1) and 1 tail (0) — the toy dataset the MLE is fit to. */
export const FLIPS: number[] = [1, 1, 0, 1, 1];

export function headsCount(flips: number[] = FLIPS): number {
  return flips.reduce((sum, f) => sum + f, 0);
}

/** The maximum likelihood estimate for a Bernoulli parameter is simply the observed proportion of heads. */
export function mleEstimate(flips: number[] = FLIPS): number {
  return headsCount(flips) / flips.length;
}

/** Bernoulli log-likelihood of the whole dataset at a candidate p: k*ln(p) + (n-k)*ln(1-p). */
export function logLikelihood(p: number, flips: number[] = FLIPS): number {
  const n = flips.length;
  const k = headsCount(flips);
  return k * Math.log(p) + (n - k) * Math.log(1 - p);
}
