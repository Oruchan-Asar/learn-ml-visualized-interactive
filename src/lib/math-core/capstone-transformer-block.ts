/**
 * Capstone: assemble a full Transformer block out of pieces built earlier in this Part —
 * multi-head self-attention, a residual connection, LayerNorm, and a position-wise feedforward
 * (MLP) sublayer — applied twice in the standard order:
 *
 *   z      = LayerNorm(x + MultiHeadAttention(x))
 *   output = LayerNorm(z + FFN(z))
 *
 * Two fixed 3D tokens go all the way through, by hand-checkable arithmetic. Multi-head attention
 * uses two toy heads, each attending over a *different slice* of each token's dimensions — Head A
 * over dims [0,1], Head B over dim [2] — then concatenates their outputs back into one 3D vector.
 * That's the real `concat(head_1, ..., head_h)` operation from the multi-head-attention chapter,
 * just with h = 2 and small enough slices that every number is traceable by hand.
 */

export const DIM = 3;
export const HIDDEN_DIM = 2;

export const TOKEN_LABELS = ["x1", "x2"];
/** Two 3D token vectors, small enough to trace the whole block by hand. */
export const TOKENS: number[][] = [
  [1, 0, 1],
  [0, 1, 1],
];

function dot(a: number[], b: number[]): number {
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}

function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

function relu(x: number): number {
  return Math.max(0, x);
}

function layerNorm(v: number[], eps = 1e-5): number[] {
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  const variance = v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length;
  const std = Math.sqrt(variance + eps);
  return v.map((x) => (x - mean) / std);
}

function addVec(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + b[i]);
}

/** A "head" attends over one slice of each token's dimensions, not the whole vector. */
export type HeadSlice = (t: number[]) => number[];

export const HEAD_A_LABEL = "Head A (dims 0–1)";
export const HEAD_B_LABEL = "Head B (dim 2)";

export function headASlice(t: number[]): number[] {
  return [t[0], t[1]];
}
export function headBSlice(t: number[]): number[] {
  return [t[2]];
}

/** One head's attention weights for a given query token, scaled by 1/sqrt(slice dimension). */
export function headAttentionWeights(queryIndex: number, slice: HeadSlice, tokens: number[][] = TOKENS): number[] {
  const projected = tokens.map(slice);
  const q = projected[queryIndex];
  const scale = Math.sqrt(q.length);
  const scores = projected.map((k) => dot(q, k) / scale);
  return softmax(scores);
}

/** One head's output vector for a given query token: its attention-weighted sum of the (sliced) tokens. */
export function headAttentionOutput(queryIndex: number, slice: HeadSlice, tokens: number[][] = TOKENS): number[] {
  const weights = headAttentionWeights(queryIndex, slice, tokens);
  const projected = tokens.map(slice);
  return weights.reduce((acc, w, i) => addVec(acc, projected[i].map((x) => x * w)), new Array(projected[0].length).fill(0));
}

/** The full attention weight matrix for one head, every query row stacked. */
export function headAttentionMatrix(slice: HeadSlice, tokens: number[][] = TOKENS): number[][] {
  return tokens.map((_, i) => headAttentionWeights(i, slice, tokens));
}

export const HEAD_A_MATRIX: number[][] = headAttentionMatrix(headASlice);
export const HEAD_B_MATRIX: number[][] = headAttentionMatrix(headBSlice);

/** Multi-head attention: run both heads over their own slice, concatenate their outputs back into one vector. */
export function multiHeadAttentionOutput(queryIndex: number, tokens: number[][] = TOKENS): number[] {
  return [...headAttentionOutput(queryIndex, headASlice, tokens), ...headAttentionOutput(queryIndex, headBSlice, tokens)];
}

export interface FfnResult {
  hidden: number[];
  output: number[];
}

/** Position-wise feedforward: same W1/W2 applied to every token, only the bias is adjustable here. */
export const W1: number[][] = [
  [1, 1, 0],
  [0, 1, 1],
];
export const W2: number[][] = [
  [1, 0],
  [0, 1],
  [1, 1],
];
export const DEFAULT_BIAS = 0;
export const BIAS_DOMAIN: [number, number] = [-1, 2];

export function feedForward(v: number[], bias = DEFAULT_BIAS): FfnResult {
  const hidden = W1.map((row) => relu(dot(row, v) + bias));
  const output = W2.map((row) => dot(row, hidden));
  return { hidden, output };
}

export interface BlockResult {
  attentionOut: number[][];
  residual1: number[][];
  norm1: number[][];
  ffn: FfnResult[];
  residual2: number[][];
  norm2: number[][];
}

/** The full Transformer block: multi-head self-attention, add & norm, feedforward (MLP), add & norm. */
export function transformerBlock(bias = DEFAULT_BIAS, tokens: number[][] = TOKENS): BlockResult {
  const attentionOut = tokens.map((_, i) => multiHeadAttentionOutput(i, tokens));
  const residual1 = tokens.map((t, i) => addVec(t, attentionOut[i]));
  const norm1 = residual1.map((v) => layerNorm(v));
  const ffn = norm1.map((v) => feedForward(v, bias));
  const residual2 = norm1.map((v, i) => addVec(v, ffn[i].output));
  const norm2 = residual2.map((v) => layerNorm(v));
  return { attentionOut, residual1, norm1, ffn, residual2, norm2 };
}
