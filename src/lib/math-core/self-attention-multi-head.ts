import { TOKENS, softmax, type AttentionToken } from "@/lib/math-core/attention";

export { TOKENS };
export type { AttentionToken };

/** Plain self-attention: every token is its own query, attending over the full 2D vectors (including itself). */
export function fullSelfAttentionRow(queryIndex: number, tokens: AttentionToken[] = TOKENS): number[] {
  const q = tokens[queryIndex];
  const scores = tokens.map((k) => (q.x * k.x + q.y * k.y) / Math.sqrt(2));
  return softmax(scores);
}

export function fullSelfAttentionMatrix(tokens: AttentionToken[] = TOKENS): number[][] {
  return tokens.map((_, i) => fullSelfAttentionRow(i, tokens));
}

export const FULL_SELF_ATTENTION_MATRIX: number[][] = fullSelfAttentionMatrix();

/** A single-number "head": projects each 2D token down onto one axis before comparing. */
export type HeadProjection = (t: { x: number; y: number }) => number;

export const HEAD_A_LABEL = "Head A (x-axis)";
export const HEAD_B_LABEL = "Head B (y-axis)";

export function headAProject(t: { x: number; y: number }): number {
  return t.x;
}
export function headBProject(t: { x: number; y: number }): number {
  return t.y;
}

/** One head's self-attention row for a given query token: project every token to 1D, then attend. */
export function headSelfAttentionRow(
  queryIndex: number,
  project: HeadProjection,
  tokens: AttentionToken[] = TOKENS,
): number[] {
  const projected = tokens.map(project);
  const q = projected[queryIndex];
  const scores = projected.map((k) => q * k); // 1D projection: sqrt(1) = 1, no scaling needed
  return softmax(scores);
}

export function headSelfAttentionMatrix(project: HeadProjection, tokens: AttentionToken[] = TOKENS): number[][] {
  return tokens.map((_, i) => headSelfAttentionRow(i, project, tokens));
}

export const HEAD_A_MATRIX: number[][] = headSelfAttentionMatrix(headAProject);
export const HEAD_B_MATRIX: number[][] = headSelfAttentionMatrix(headBProject);

/** How much the two heads disagree about a given query token's attention distribution. */
export function headDisagreement(queryIndex: number): number {
  const a = HEAD_A_MATRIX[queryIndex];
  const b = HEAD_B_MATRIX[queryIndex];
  return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));
}

export const MOST_DISAGREEING_TOKEN = "sat";
