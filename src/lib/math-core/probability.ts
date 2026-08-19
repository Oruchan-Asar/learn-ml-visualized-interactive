/** Turns arbitrary non-negative weights into a valid distribution: non-negative, summing to 1. */
export function normalize(weights: number[]): number[] {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return weights.map(() => 1 / weights.length);
  return weights.map((w) => w / total);
}

/** E[X] = sum of each outcome's value weighted by its probability. */
export function expectedValue(probabilities: number[], values: number[]): number {
  return probabilities.reduce((sum, p, i) => sum + p * values[i], 0);
}
