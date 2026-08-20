import { TOKENS, softmax, type AttentionToken, type Vec2 } from "@/lib/math-core/attention";

export { TOKENS };
export type { AttentionToken, Vec2 };

/** A generic placeholder query vector standing in for the [MASK] token's embedding. */
export const MASK_QUERY: Vec2 = { x: 1, y: 1 };
/** "cat" — the middle token of "the cat sat", chosen so a left-only model loses everything to its right. */
export const MASK_INDEX = 1;

function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

function weightedSum(weights: number[], tokens: AttentionToken[]): Vec2 {
  return tokens.reduce((acc, t, i) => ({ x: acc.x + weights[i] * t.x, y: acc.y + weights[i] * t.y }), { x: 0, y: 0 });
}

/** Bidirectional (BERT-style) prediction: attend over every OTHER token, both before and after the mask. */
export function bidirectionalPrediction(maskIndex: number = MASK_INDEX, query: Vec2 = MASK_QUERY, tokens: AttentionToken[] = TOKENS): Vec2 {
  const visible = tokens.filter((_, i) => i !== maskIndex);
  const scores = visible.map((t) => dot(query, t) / Math.sqrt(2));
  const weights = softmax(scores);
  return weightedSum(weights, visible);
}

/** Causal (left-to-right) prediction: attend only over tokens strictly before the mask — the tokens to its right don't exist yet. */
export function causalPrediction(maskIndex: number = MASK_INDEX, query: Vec2 = MASK_QUERY, tokens: AttentionToken[] = TOKENS): Vec2 {
  const visible = tokens.filter((_, i) => i < maskIndex);
  const scores = visible.map((t) => dot(query, t) / Math.sqrt(2));
  const weights = softmax(scores);
  return weightedSum(weights, visible);
}

export function squaredError(predicted: Vec2, actual: Vec2): number {
  return (predicted.x - actual.x) ** 2 + (predicted.y - actual.y) ** 2;
}

export function maskedToken(maskIndex: number = MASK_INDEX, tokens: AttentionToken[] = TOKENS): AttentionToken {
  return tokens[maskIndex];
}
