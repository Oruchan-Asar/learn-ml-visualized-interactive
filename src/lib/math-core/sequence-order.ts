export interface Vec2 {
  x: number;
  y: number;
}

/** Two "tokens" — think of them as two different words, one-hot encoded. */
export const TOKEN_X = [1, 0];
export const TOKEN_Y = [0, 1];

/** Same two tokens, opposite order. The task is to tell these two sequences apart. */
export const SEQUENCE_A = [TOKEN_X, TOKEN_Y]; // label 0
export const SEQUENCE_B = [TOKEN_Y, TOKEN_X]; // label 1

export function sumPool(sequence: number[][]): number[] {
  return sequence.reduce((acc, tok) => [acc[0] + tok[0], acc[1] + tok[1]], [0, 0]);
}

/** Summing away order: both sequences pool to the exact same vector. */
export const POOLED_A: number[] = sumPool(SEQUENCE_A);
export const POOLED_B: number[] = sumPool(SEQUENCE_B);

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function logit(w: Vec2, pooled: number[]): number {
  return w.x * pooled[0] + w.y * pooled[1];
}

/** Mean binary cross-entropy over both examples, as a function of the two dense weights. */
export function f(w: Vec2): number {
  const pA = sigmoid(logit(w, POOLED_A)); // target 0
  const pB = sigmoid(logit(w, POOLED_B)); // target 1
  const lossA = -Math.log(1 - pA);
  const lossB = -Math.log(pB);
  return (lossA + lossB) / 2;
}

export function gradient(w: Vec2): Vec2 {
  const pA = sigmoid(logit(w, POOLED_A));
  const pB = sigmoid(logit(w, POOLED_B));
  const dA = pA - 0;
  const dB = pB - 1;
  return {
    x: (dA * POOLED_A[0] + dB * POOLED_B[0]) / 2,
    y: (dA * POOLED_A[1] + dB * POOLED_B[1]) / 2,
  };
}

/** No matter the weights, the best this pooled representation can ever reach: pure guessing. */
export const MIN_LOSS = Math.log(2);
export const DOMAIN: [number, number] = [-3, 3];
export const TOLERANCE = 0.01;
