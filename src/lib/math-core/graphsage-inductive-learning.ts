import { NODES, EDGES, neighbors } from "./graphs-as-data";
import { initialFeatureMap, type FeatureMap } from "./message-passing-and-gcn";

export const SAMPLE_SIZE = 2;

/**
 * A deterministic stand-in for GraphSAGE's random neighbor sampling: always take the first
 * `SAMPLE_SIZE` neighbors in sorted id order, so the exact same "random" sample is reproducible by
 * hand every time. When a node has SAMPLE_SIZE or fewer neighbors, sampling changes nothing.
 */
export function sampleNeighbors(id: string, k: number = SAMPLE_SIZE): string[] {
  return [...neighbors(id)].sort().slice(0, k);
}

/** Mean of self + a SAMPLED subset of neighbors — GraphSAGE's aggregation, trading exactness for a fixed, bounded amount of work per node. */
export function sampledAggregate(features: FeatureMap, id: string, k: number = SAMPLE_SIZE): number {
  const group = [features[id], ...sampleNeighbors(id, k).map((n) => features[n])];
  return group.reduce((a, b) => a + b, 0) / group.length;
}

/** Mean of self + EVERY neighbor — the full aggregation from the previous chapter, for direct comparison. */
export function fullAggregate(features: FeatureMap, id: string): number {
  const group = [features[id], ...neighbors(id).map((n) => features[n])];
  return group.reduce((a, b) => a + b, 0) / group.length;
}

/**
 * A brand-new node, never seen during "training" — degree 1, connected only to node 0. Because
 * sampledAggregate is a plain function of whatever neighborhood it's handed, not a lookup table keyed
 * on node identity, it applies immediately: no retraining, no new parameters.
 */
export const NEW_NODE_ID = "6";
export const NEW_NODE_FEATURE = 4;
export const NEW_NODE_NEIGHBOR = "0";

export function featuresWithNewNode(): FeatureMap {
  return { ...initialFeatureMap(), [NEW_NODE_ID]: NEW_NODE_FEATURE };
}

/** The new node's aggregate, computed with the exact same function used on every original node. */
export function newNodeAggregate(): number {
  const features = featuresWithNewNode();
  const group = [features[NEW_NODE_ID], features[NEW_NODE_NEIGHBOR]];
  return group.reduce((a, b) => a + b, 0) / group.length;
}

export { NODES, EDGES };
