/**
 * Capstone scoring function: given a fixed scenario (a ride-sharing driver-location service), scores
 * one design — a choice of consistency model (Part I), replication strategy (Part II/IV), and
 * consensus protocol (Part II/V) — against that scenario's stated constraints. Each axis is scored
 * independently against the same four constraints and summed; there is no simulation here, just a
 * small, hand-addable point table, so a reader can verify any score by hand.
 *
 * The scenario: thousands of drivers each push a GPS ping every few seconds (huge write volume);
 * a location a few seconds stale is completely fine for "show nearby drivers" (staleness is cheap);
 * every server is operated by the same company (no untrusted/Byzantine participants); and a driver's
 * ping must never be flatly rejected just because their region's datacenter is cut off from the rest
 * (availability during a partition matters more than a single global order of events).
 */

export type ConsistencyModel = "linearizability" | "causal" | "eventual";
export type ReplicationStrategy = "primary-backup" | "quorum" | "gossip";
export type ConsensusProtocol = "raft" | "pbft" | "none";

export interface Design {
  consistency: ConsistencyModel;
  replication: ReplicationStrategy;
  consensus: ConsensusProtocol;
}

/** Eventual consistency fits: staleness is explicitly fine. Linearizability forces rejecting writes
 *  on the minority side of a partition (CAP), which this scenario explicitly forbids. */
const CONSISTENCY_SCORES: Record<ConsistencyModel, number> = {
  eventual: 40,
  causal: 20,
  linearizability: -30,
};

/** Gossip-based epidemic replication scales horizontally with write volume and keeps accepting local
 *  writes through a partition. A single primary is both a write bottleneck and a partition hazard. */
const REPLICATION_SCORES: Record<ReplicationStrategy, number> = {
  gossip: 40,
  quorum: 15,
  "primary-backup": -20,
};

/** Raw location pings need no agreement on a single value — gossip's eventual convergence is enough,
 *  so "none" scores best. PBFT's 3f+1-replica Byzantine tolerance is pure overhead for one trusted operator. */
const CONSENSUS_SCORES: Record<ConsensusProtocol, number> = {
  none: 20,
  raft: 0,
  pbft: -30,
};

/** A design scores 70+ out of a possible 100 to count as a coherent fit for this scenario. */
export const PASS_THRESHOLD = 70;

/** Sums the three independent per-axis scores — every term is a small table lookup, addable by hand. */
export function scoreDesign(design: Design): number {
  return CONSISTENCY_SCORES[design.consistency] + REPLICATION_SCORES[design.replication] + CONSENSUS_SCORES[design.consensus];
}

export function isCoherentDesign(design: Design): boolean {
  return scoreDesign(design) >= PASS_THRESHOLD;
}
