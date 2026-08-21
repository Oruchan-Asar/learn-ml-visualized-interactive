import { NODES, FEATURES } from "./graphs-as-data";
import { leakyRelu } from "./graph-attention-networks";

export type Edge = [string, string];
export type FeatureMap = Record<string, number>;

/**
 * The same six atoms and starting features from Chapter 1, wired into three different bond structures.
 * A GNN that only looked at atom features and ignored bonds would predict the exact same property for
 * all three — the whole reason this part exists is that real molecular property prediction can't do
 * that.
 */
export const RING_EDGES: Edge[] = [
  ["0", "1"],
  ["0", "2"],
  ["1", "2"],
  ["1", "3"],
  ["3", "4"],
  ["3", "5"],
];
export const CHAIN_EDGES: Edge[] = [
  ["0", "1"],
  ["1", "2"],
  ["2", "3"],
  ["3", "4"],
  ["4", "5"],
];
export const STAR_EDGES: Edge[] = [
  ["1", "0"],
  ["1", "2"],
  ["1", "3"],
  ["1", "4"],
  ["1", "5"],
];

export const STRUCTURES = [
  { label: "ring", edges: RING_EDGES },
  { label: "chain", edges: CHAIN_EDGES },
  { label: "star", edges: STAR_EDGES },
];

export function initialFeatures(): FeatureMap {
  return Object.fromEntries(NODES.map((n, i) => [n.id, FEATURES[i]]));
}

function neighborsIn(edges: Edge[], id: string): string[] {
  const result: string[] = [];
  for (const [u, v] of edges) {
    if (u === id) result.push(v);
    if (v === id) result.push(u);
  }
  return result;
}

/** Layer 1: the GCN rule from two chapters ago — every atom's new value is the mean of itself and its bonded neighbors. */
export function gcnRound(edges: Edge[], features: FeatureMap): FeatureMap {
  const out: FeatureMap = {};
  for (const n of NODES) {
    const group = [features[n.id], ...neighborsIn(edges, n.id).map((j) => features[j])];
    out[n.id] = group.reduce((a, b) => a + b, 0) / group.length;
  }
  return out;
}

/** Layer 2: the GAT rule from last chapter — every atom's new value is an attention-weighted sum over itself and its bonded neighbors. */
export function gatRound(edges: Edge[], features: FeatureMap): FeatureMap {
  const out: FeatureMap = {};
  for (const n of NODES) {
    const set = [n.id, ...neighborsIn(edges, n.id)];
    const scores = set.map((j) => leakyRelu(features[j] - features[n.id]));
    const maxScore = Math.max(...scores);
    const exps = scores.map((s) => Math.exp(s - maxScore));
    const sum = exps.reduce((a, b) => a + b, 0);
    out[n.id] = set.reduce((s, j, k) => s + (exps[k] / sum) * features[j], 0);
  }
  return out;
}

/** The full two-layer pipeline: one round of mean aggregation, then one round of attention on top of that — message passing and attention, stacked, exactly the way real GNNs chain multiple layers. */
export function embed(edges: Edge[], features: FeatureMap = initialFeatures()): FeatureMap {
  return gatRound(edges, gcnRound(edges, features));
}

/** Sum-pooling readout: the whole-molecule prediction is the sum of every atom's final embedding — the simplest way to turn six per-atom numbers into one molecule-level number. */
export function predictProperty(edges: Edge[], features: FeatureMap = initialFeatures()): number {
  const final = embed(edges, features);
  return Object.values(final).reduce((a, b) => a + b, 0);
}
