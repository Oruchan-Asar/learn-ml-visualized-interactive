export const DIM = 3;
export const HIDDEN_DIM = 2;

/** Two 3D token vectors, small enough to trace the whole block by hand. */
export const TOKEN_LABELS = ["x1", "x2"];
export const TOKENS: number[][] = [
  [1, 0, 1],
  [0, 1, 1],
];

/** Fixed feedforward weights: hidden_dim=2, applied identically to every token (position-wise). */
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

/** Self-attention (single head, identity projection) over the fixed token set. */
export function attentionRow(queryIndex: number, tokens: number[][] = TOKENS): number[] {
  const scores = tokens.map((k) => dot(tokens[queryIndex], k) / Math.sqrt(DIM));
  return softmax(scores);
}

export function attentionOutput(queryIndex: number, tokens: number[][] = TOKENS): number[] {
  const weights = attentionRow(queryIndex, tokens);
  return tokens.reduce((acc, t, i) => addVec(acc, t.map((v) => v * weights[i])), new Array(DIM).fill(0));
}

export interface FfnResult {
  hidden: number[];
  output: number[];
}

/** Position-wise feedforward: same W1/W2 applied to every token, only the bias is adjustable here. */
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

/** The full Transformer block: self-attention, add & norm, feedforward, add & norm. */
export function transformerBlock(bias = DEFAULT_BIAS, tokens: number[][] = TOKENS): BlockResult {
  const attentionOut = tokens.map((_, i) => attentionOutput(i, tokens));
  const residual1 = tokens.map((t, i) => addVec(t, attentionOut[i]));
  const norm1 = residual1.map((v) => layerNorm(v));
  const ffn = norm1.map((v) => feedForward(v, bias));
  const residual2 = norm1.map((v, i) => addVec(v, ffn[i].output));
  const norm2 = residual2.map((v) => layerNorm(v));
  return { attentionOut, residual1, norm1, ffn, residual2, norm2 };
}
