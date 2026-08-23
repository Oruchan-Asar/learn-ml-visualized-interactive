/**
 * An attention layer costs O(n²d): every token compares against every other token, but in exchange it can
 * retrieve any earlier token's content directly, however far back. An SSM layer costs O(nds): linear in
 * sequence length, because it only ever carries a fixed-size hidden state forward — cheap, but everything
 * before the current token has to have been compressed into that one state already. A hybrid architecture
 * (Jamba, Griffin, and similar) stacks mostly-SSM layers with a few attention layers sprinkled in, trading
 * away most of the quadratic cost while keeping a handful of layers that can still do exact long-range
 * retrieval.
 */
export const D_MODEL = 8;
export const STATE_SIZE = 4; // the SSM's fixed hidden-state width
export const NUM_LAYERS = 4;

export type LayerType = "attention" | "ssm";

/** A Jamba-style hybrid: mostly SSM layers, one attention layer for exact long-range retrieval. */
export const DEFAULT_PATTERN: LayerType[] = ["attention", "ssm", "ssm", "ssm"];
export const ALL_ATTENTION: LayerType[] = Array(NUM_LAYERS).fill("attention") as LayerType[];
export const ALL_SSM: LayerType[] = Array(NUM_LAYERS).fill("ssm") as LayerType[];

/** Full self-attention over n tokens: O(n²d) — every pair of positions, each a D_MODEL-dim comparison. */
export function attentionLayerCost(n: number, d: number = D_MODEL): number {
  return n * n * d;
}

/** An SSM recurrent scan over n tokens: O(nds) — one fixed-size state update per position, linear in n. */
export function ssmLayerCost(n: number, d: number = D_MODEL, s: number = STATE_SIZE): number {
  return n * d * s;
}

export function layerCost(type: LayerType, n: number, d: number = D_MODEL, s: number = STATE_SIZE): number {
  return type === "attention" ? attentionLayerCost(n, d) : ssmLayerCost(n, d, s);
}

/** Total compute across a stack of layers at sequence length n. */
export function totalCost(pattern: LayerType[], n: number, d: number = D_MODEL, s: number = STATE_SIZE): number {
  return pattern.reduce((sum, t) => sum + layerCost(t, n, d, s), 0);
}

/** Total cost of a NUM_LAYERS-layer stack with exactly k attention layers and the rest SSM — the count of attention layers is all that matters, not their order. */
export function costForAttentionCount(k: number, n: number, layers: number = NUM_LAYERS, d: number = D_MODEL, s: number = STATE_SIZE): number {
  return k * attentionLayerCost(n, d) + (layers - k) * ssmLayerCost(n, d, s);
}

export const SEQUENCE_LENGTHS = [4, 8, 16, 32, 64, 128];
export const ATTENTION_COUNTS = [0, 1, 2, 3, 4];
