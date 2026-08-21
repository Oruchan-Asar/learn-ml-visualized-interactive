/**
 * Softmax attention normalizes each query's row of scores independently, which is exactly what forces
 * the full n×n matrix to exist — there's no way to know a row's normalizer without first computing every
 * score in it. Drop the softmax and use a plain dot-product "kernel" between query and key instead, and
 * the double sum factors: Σⱼ(qᵢ·kⱼ)vⱼ = qᵢ·(Σⱼ kⱼvⱼ). The right-hand side's sum doesn't depend on i at
 * all — compute it once, and every query becomes a single dot product against it.
 */
export type Vec2 = [number, number];

export const QUERIES: Vec2[] = [
  [1, 0],
  [0, 1],
  [1, 1],
];
export const KEYS: Vec2[] = [
  [2, 1],
  [-1, 2],
  [1, -1],
  [0, 3],
];
export const VALUES: number[] = [3, -2, 1, 4];

export function dot(a: Vec2, b: Vec2): number {
  return a[0] * b[0] + a[1] * b[1];
}

/** The direct definition: score every key against this one query, then take the value-weighted average — an O(n) sum per query, O(n²) total across n queries. */
export function naiveLinearAttention(q: Vec2, keys: Vec2[] = KEYS, values: number[] = VALUES): number {
  const scores = keys.map((k) => dot(q, k));
  const weightedSum = scores.reduce((sum, s, j) => sum + s * values[j], 0);
  const normalizer = scores.reduce((sum, s) => sum + s, 0);
  return weightedSum / normalizer;
}

export interface LinearAttentionState {
  s: Vec2;
  z: Vec2;
}

/** One pass over the keys and values builds the running state Σⱼkⱼvⱼ (s) and Σⱼkⱼ (z) — computed exactly once, reused for every query. */
export function buildState(keys: Vec2[] = KEYS, values: number[] = VALUES): LinearAttentionState {
  const s: Vec2 = [0, 0];
  const z: Vec2 = [0, 0];
  keys.forEach((k, j) => {
    s[0] += k[0] * values[j];
    s[1] += k[1] * values[j];
    z[0] += k[0];
    z[1] += k[1];
  });
  return { s, z };
}

/** Every query's answer, from the same precomputed state — a single dot product each, no rescan of the keys. */
export function factoredLinearAttention(q: Vec2, state: LinearAttentionState = buildState()): number {
  return dot(q, state.s) / dot(q, state.z);
}

/** Total dot products for n queries against n keys, computed the naive (full-matrix) way. */
export function naiveOps(n: number): number {
  return n * n;
}

/** Total dot products for the factored approach: n to build the running state, n to evaluate every query against it. */
export function linearAttentionOps(n: number): number {
  return 2 * n;
}
