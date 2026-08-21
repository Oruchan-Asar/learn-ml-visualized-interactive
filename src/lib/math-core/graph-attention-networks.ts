import { NODES, neighbors } from "./graphs-as-data";
import { aggregateRound as gcnAggregateRound, initialFeatureMap, type FeatureMap } from "./message-passing-and-gcn";

export type { FeatureMap };
export { initialFeatureMap };

/** GAT's negative-slope constant for LeakyReLU — the standard choice from the original paper. */
export const LEAKY_SLOPE = 0.2;

export function leakyRelu(x: number, slope: number = LEAKY_SLOPE): number {
  return x >= 0 ? x : slope * x;
}

/**
 * Every node in i's attention neighborhood — itself first, then its graph neighbors. Real GAT layers add
 * a self-loop before computing attention for exactly this reason: without it, a node's own current value
 * has no way to survive into its own update, no matter how it compares to its neighbors'.
 */
export function attentionSet(id: string): string[] {
  return [id, ...neighbors(id)];
}

/**
 * The raw (pre-softmax) compatibility score between i and a member j of its attention set. A real GAT
 * layer computes this as LeakyReLU(aᵀ[Whᵢ ‖ Whⱼ]) with a learned weight matrix W and attention vector a;
 * with scalar features and W fixed to the identity, that reduces to a linear combination of hᵢ and hⱼ.
 * This chapter fixes that combination to hⱼ − hᵢ: a neighbor with a much larger feature scores far
 * higher, one with a much smaller feature is only mildly suppressed by the leaky (not zeroed) negative
 * slope — asymmetric on purpose, so the softmax below doesn't just recreate an average.
 */
export function attentionScore(i: string, j: string, features: FeatureMap): number {
  return leakyRelu(features[j] - features[i]);
}

/** Softmax-normalized attention weights over i's attention set — sum to 1, and answer "how much does each neighbor matter" instead of assuming they're equal. */
export function attentionWeights(id: string, features: FeatureMap): FeatureMap {
  const set = attentionSet(id);
  const scores = set.map((j) => attentionScore(id, j, features));
  const maxScore = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - maxScore));
  const sum = exps.reduce((a, b) => a + b, 0);
  return Object.fromEntries(set.map((j, k) => [j, exps[k] / sum]));
}

/** One node's GAT-updated feature: the attention-weighted sum of its neighborhood, in place of GCN's unweighted mean. */
export function aggregateNode(id: string, features: FeatureMap): number {
  const weights = attentionWeights(id, features);
  return attentionSet(id).reduce((sum, j) => sum + weights[j] * features[j], 0);
}

/** One full round of GAT message passing across every node at once — every node's weights are computed from the same pre-round snapshot. */
export function aggregateRound(features: FeatureMap): FeatureMap {
  return Object.fromEntries(NODES.map((n) => [n.id, aggregateNode(n.id, features)]));
}

/** Attention weights for every edge touching `id`, keyed the way GraphPlayground expects (sorted id pair) — lets the graph draw each neighbor's edge with its own weight instead of a uniform line. */
export function edgeWeightsForFocus(id: string, features: FeatureMap): Record<string, number> {
  const weights = attentionWeights(id, features);
  return Object.fromEntries(neighbors(id).map((j) => [[id, j].sort().join("::"), weights[j]]));
}

/** How far a node's GAT update diverges from what a flat GCN average would have produced on the same starting features — the gap attention creates by refusing to treat every neighbor equally. */
export function divergenceFromGCN(features: FeatureMap = initialFeatureMap()): Record<string, number> {
  const gat = aggregateRound(features);
  const gcn = gcnAggregateRound(features);
  return Object.fromEntries(NODES.map((n) => [n.id, gat[n.id] - gcn[n.id]]));
}
