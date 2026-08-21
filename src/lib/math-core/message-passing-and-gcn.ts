import { NODES, neighbors } from "./graphs-as-data";

export type FeatureMap = Record<string, number>;

export function initialFeatureMap(): FeatureMap {
  return Object.fromEntries(NODES.map((n) => [n.id, n.feature]));
}

/**
 * One round of GCN-style message passing: every node's new feature is the mean of its own current
 * feature and every neighbor's — the simplest possible aggregation rule, with no learned weights, so
 * every number here is exact arithmetic. A leaf like node 4 (one neighbor) averages 2 values; a hub
 * like node 3 (three neighbors) averages 4.
 */
export function aggregateRound(features: FeatureMap): FeatureMap {
  const next: FeatureMap = {};
  for (const n of NODES) {
    const group = [features[n.id], ...neighbors(n.id).map((id) => features[id])];
    next[n.id] = group.reduce((a, b) => a + b, 0) / group.length;
  }
  return next;
}

/** Runs `rounds` steps of aggregation, returning every intermediate feature map, starting with round 0 (the raw input). */
export function runRounds(rounds: number): FeatureMap[] {
  const history: FeatureMap[] = [initialFeatureMap()];
  for (let i = 0; i < rounds; i++) {
    history.push(aggregateRound(history[history.length - 1]));
  }
  return history;
}

/** Population variance across all node features — a single number tracking how "smoothed together" the graph has become. */
export function variance(features: FeatureMap): number {
  const values = Object.values(features);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
}
