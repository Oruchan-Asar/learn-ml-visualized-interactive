/** The logistic sigmoid: squashes any real number into (0, 1). */
export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/** σ'(z) = σ(z)(1 - σ(z)) — maximal at z=0, vanishing far from it. */
export function sigmoidDerivative(z: number): number {
  const s = sigmoid(z);
  return s * (1 - s);
}

/** The full logistic regression score: σ(wx + b). */
export function logisticScore(w: number, b: number, x: number): number {
  return sigmoid(w * x + b);
}

/** d/dx [σ(wx+b)] via the chain rule: σ'(wx+b) · w. */
export function logisticScoreDerivative(w: number, b: number, x: number): number {
  return sigmoidDerivative(w * x + b) * w;
}
