/** Shannon entropy, in bits: H(X) = -sum P(x_i) log2 P(x_i). Zero probabilities contribute 0. */
export function entropy(probabilities: number[]): number {
  return -probabilities.reduce((sum, p) => sum + (p > 0 ? p * Math.log2(p) : 0), 0);
}
