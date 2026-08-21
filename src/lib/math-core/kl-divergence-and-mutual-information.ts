import { entropy } from "./entropy";

/** A fixed reference distribution over 3 outcomes — the "true" distribution Q is being compared against. */
export const P_REFERENCE = [0.5, 0.3, 0.2];

/**
 * KL divergence, in bits: D_KL(P || Q) = sum P(x) * log2(P(x)/Q(x)) — the extra bits needed to encode
 * data from P using a code built for Q instead. Zero exactly when P and Q are identical; assumes
 * q_i > 0 wherever p_i > 0.
 */
export function klDivergence(p: number[], q: number[]): number {
  return p.reduce((sum, pi, i) => sum + (pi > 0 ? pi * Math.log2(pi / q[i]) : 0), 0);
}

/** Cross-entropy, in bits: H(P, Q) = -sum P(x) * log2(Q(x)). Always equals H(P) + D_KL(P || Q). */
export function crossEntropy(p: number[], q: number[]): number {
  return -p.reduce((sum, pi, i) => sum + pi * Math.log2(q[i]), 0);
}

/**
 * The 2x2 joint distribution used for the mutual-information worked example: X and Y agree with each
 * other far more often than chance would predict (rows are X=0/X=1, columns are Y=0/Y=1).
 */
export const JOINT: number[][] = [
  [0.4, 0.1],
  [0.1, 0.4],
];

export function marginalX(joint: number[][]): number[] {
  return joint.map((row) => row.reduce((a, b) => a + b, 0));
}

export function marginalY(joint: number[][]): number[] {
  const cols = joint[0].length;
  return Array.from({ length: cols }, (_, j) => joint.reduce((sum, row) => sum + row[j], 0));
}

/** Joint entropy, in bits: H(X, Y) = -sum P(x,y) * log2 P(x,y). */
export function jointEntropy(joint: number[][]): number {
  return entropy(joint.flat());
}

/**
 * Mutual information, in bits: I(X;Y) = sum P(x,y) * log2( P(x,y) / (P(x)P(y)) ) — the KL divergence
 * between the true joint distribution and the independent distribution it would collapse to if X and Y
 * shared no information at all. Zero exactly when X and Y are independent.
 */
export function mutualInformation(joint: number[][]): number {
  const mx = marginalX(joint);
  const my = marginalY(joint);
  let sum = 0;
  for (let i = 0; i < joint.length; i++) {
    for (let j = 0; j < joint[i].length; j++) {
      const pxy = joint[i][j];
      if (pxy > 0) sum += pxy * Math.log2(pxy / (mx[i] * my[j]));
    }
  }
  return sum;
}
