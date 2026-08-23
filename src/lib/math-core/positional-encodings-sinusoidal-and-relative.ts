/**
 * A dot product q·k doesn't know where q or k sat in the sequence — it's the same number no matter which
 * positions the two vectors came from. Self-attention is built entirely out of dot products, so on its
 * own it's permutation-invariant: shuffle the tokens and attention can't tell. Positional encoding fixes
 * this by injecting position somewhere into the computation. Sinusoidal encoding does it by adding a
 * position-dependent vector to each token's content before the dot product; a relative scheme instead
 * adds a bias straight onto the score, keyed only by the offset between the two positions.
 */
export const D_MODEL = 4;
export const BASE = 10000;

/** The angular frequency of dimension-pair i: pair 0 spins fastest, higher pairs spin ever more slowly. */
export function angleRate(i: number, d: number = D_MODEL): number {
  return 1 / Math.pow(BASE, (2 * i) / d);
}

/** The sinusoidal positional encoding vector for one position: alternating sin/cos, one pair per frequency. */
export function sinusoidalEncoding(pos: number, d: number = D_MODEL): number[] {
  const enc: number[] = [];
  for (let i = 0; i < d / 2; i++) {
    const rate = angleRate(i, d);
    enc.push(Math.sin(pos * rate));
    enc.push(Math.cos(pos * rate));
  }
  return enc;
}

export function dot(a: number[], b: number[]): number {
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}

export function add(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + b[i]);
}

/** Two fixed 4D "content" embeddings — what a token means, independent of where it sits. */
export const TOKEN_A: number[] = [1, 0, 0.5, -0.5];
export const TOKEN_B: number[] = [0, 1, -0.5, 0.5];

/** The score a plain (position-blind) dot product gives two tokens — the same value no matter which order they appear in. */
export function contentScore(a: number[] = TOKEN_A, b: number[] = TOKEN_B): number {
  return dot(a, b);
}

/** The score once each token's sinusoidal position vector has been added to its content — now order-sensitive. */
export function positionAwareScore(posA: number, posB: number, a: number[] = TOKEN_A, b: number[] = TOKEN_B, d: number = D_MODEL): number {
  return dot(add(a, sinusoidalEncoding(posA, d)), add(b, sinusoidalEncoding(posB, d)));
}

/**
 * A relative-position scheme (T5-/Transformer-XL-style): instead of touching the embeddings at all, add a
 * bias looked up by the *distance* between the two positions directly onto the plain content score. Shift
 * both positions by the same amount and the distance — and so the bias — never changes.
 */
export const RELATIVE_BIAS_TABLE: Record<number, number> = {
  0: 0.2,
  1: -0.3,
  2: 0.1,
  3: -0.15,
};

export function relativeBias(distance: number): number {
  return RELATIVE_BIAS_TABLE[distance] ?? 0;
}

export function relativeScore(distance: number, a: number[] = TOKEN_A, b: number[] = TOKEN_B): number {
  return contentScore(a, b) + relativeBias(distance);
}

/** Candidate sequence-start offsets used by the demos and checkpoint. */
export const OFFSETS = [0, 3, 5, 9, 10, 15];
