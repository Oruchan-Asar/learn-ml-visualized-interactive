/**
 * Four small "expert" feedforward functions and a router that scores every one of them per token,
 * but only ever runs the top-2 — the other two experts never get evaluated at all for that token.
 * A dense model would run all four, every time, for every token.
 */
export interface Expert {
  a: number;
  b: number;
}

export const EXPERTS: Expert[] = [
  { a: 1, b: 0 },
  { a: -1, b: 5 },
  { a: 2, b: -3 },
  { a: 0.5, b: 1 },
];

export const ROUTER_WEIGHTS: number[] = [0.5, -0.5, 1.0, -1.0];
export const TOP_K = 2;

export function expertOutput(expert: Expert, x: number): number {
  return expert.a * x + expert.b;
}

export function routerLogits(x: number, weights: number[] = ROUTER_WEIGHTS): number[] {
  return weights.map((w) => w * x);
}

export function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export interface RoutingResult {
  selectedIndices: number[];
  fullProbs: number[];
  renormalizedWeights: number[];
  output: number;
  /** null for experts that were never run for this token. */
  expertOutputs: (number | null)[];
}

export function route(x: number, topK: number = TOP_K, experts: Expert[] = EXPERTS, weights: number[] = ROUTER_WEIGHTS): RoutingResult {
  const logits = routerLogits(x, weights);
  const fullProbs = softmax(logits);
  const ranked = fullProbs.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p);
  const selectedIndices = ranked.slice(0, topK).map((r) => r.i);
  const selectedProbs = selectedIndices.map((i) => fullProbs[i]);
  const probSum = selectedProbs.reduce((a, b) => a + b, 0);
  const renormalizedWeights = selectedProbs.map((p) => p / probSum);
  const output = selectedIndices.reduce((sum, idx, k) => sum + renormalizedWeights[k] * expertOutput(experts[idx], x), 0);
  const expertOutputs = experts.map((e, i) => (selectedIndices.includes(i) ? expertOutput(e, x) : null));
  return { selectedIndices, fullProbs, renormalizedWeights, output, expertOutputs };
}
