export interface Vec2 {
  x: number;
  y: number;
}

export interface AttentionToken extends Vec2 {
  label: string;
}

/** Three fixed token vectors, standing in for words or encoder hidden states. */
export const TOKENS: AttentionToken[] = [
  { label: "the", x: 2, y: 0 },
  { label: "cat", x: 0, y: 2 },
  { label: "sat", x: 1, y: 1 },
];

export const DIM = 2;
export const DOMAIN: [number, number] = [-3, 3];
export const DEFAULT_QUERY: Vec2 = { x: 1, y: 1 };
export const TARGET_WEIGHT = 0.7;
export const TARGET_TOKEN = "cat";

function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

export function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/** Scaled dot-product attention scores: q · k_i, scaled by 1/sqrt(d) so the softmax doesn't saturate as d grows. */
export function attentionScores(query: Vec2, tokens: AttentionToken[] = TOKENS): number[] {
  return tokens.map((t) => dot(query, t) / Math.sqrt(DIM));
}

export function attentionWeights(query: Vec2, tokens: AttentionToken[] = TOKENS): number[] {
  return softmax(attentionScores(query, tokens));
}

/** The weighted sum of token vectors, weighted by attention — the actual output attention produces. */
export function attentionContext(query: Vec2, tokens: AttentionToken[] = TOKENS): Vec2 {
  const weights = attentionWeights(query, tokens);
  return tokens.reduce(
    (acc, t, i) => ({ x: acc.x + weights[i] * t.x, y: acc.y + weights[i] * t.y }),
    { x: 0, y: 0 },
  );
}
