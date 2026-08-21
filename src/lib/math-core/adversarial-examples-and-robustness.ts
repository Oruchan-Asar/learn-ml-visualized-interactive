/**
 * A single pixel nudged by 0.1 is invisible. Eight pixels each nudged by 0.1, in exactly the direction
 * that lowers the classifier's score, is invisible too — but their combined effect on w·x doesn't stay
 * small, because it sums across every dimension. That's the entire mechanism behind an adversarial
 * example: no single change looks suspicious, but a linear classifier only ever sees the sum.
 */
export const DIMENSIONS = 9;
export const WEIGHTS: number[] = Array(DIMENSIONS).fill(1);
export const BIAS = -4.5;
export const ORIGINAL_INPUT: number[] = Array(DIMENSIONS).fill(0.6);

export function dot(a: number[], b: number[]): number {
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** The classifier's confidence that x is in the positive class. */
export function predict(x: number[], weights: number[] = WEIGHTS, bias: number = BIAS): number {
  return sigmoid(dot(weights, x) + bias);
}

/**
 * FGSM: perturb every dimension by exactly epsilon, in whichever direction lowers the classifier's
 * score fastest — the sign of the weight, negated. Each individual change is bounded by epsilon, however
 * small; the combined effect on the dot product is epsilon times the sum of |weight|, not epsilon alone.
 */
export function fgsmPerturbation(epsilon: number, weights: number[] = WEIGHTS): number[] {
  return weights.map((w) => -epsilon * Math.sign(w));
}

export function perturb(x: number[], epsilon: number, weights: number[] = WEIGHTS): number[] {
  const delta = fgsmPerturbation(epsilon, weights);
  return x.map((xi, i) => xi + delta[i]);
}

export const EPSILON_CANDIDATES = [0.05, 0.1, 0.15, 0.2];
