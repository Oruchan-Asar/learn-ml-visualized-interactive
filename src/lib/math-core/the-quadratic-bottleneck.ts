/**
 * Self-attention scores every query against every key — n positions, each attended to by all n others,
 * each comparison a D_MODEL-dimensional dot product. That's n² comparisons, not n. A single per-token
 * linear layer (or the feedforward block sitting right next to attention in every Transformer block)
 * costs only n — one pass per token, no pairwise comparison at all.
 */
export const D_MODEL = 8;

export const SEQUENCE_LENGTHS = [4, 8, 16, 32, 64, 128];

/** Multiply-adds to build the full n×n attention score matrix: n queries × n keys × D_MODEL-dim dot product each. */
export function attentionOps(n: number, d: number = D_MODEL): number {
  return n * n * d;
}

/** Multiply-adds for a single per-token linear transform — one D_MODEL-dim pass per position, no pairwise comparison. */
export function linearOps(n: number, d: number = D_MODEL): number {
  return n * d;
}

/** How many times more expensive attention is than a linear layer at the same sequence length — this ratio is exactly n, regardless of D_MODEL. */
export function costRatio(n: number, d: number = D_MODEL): number {
  return attentionOps(n, d) / linearOps(n, d);
}
