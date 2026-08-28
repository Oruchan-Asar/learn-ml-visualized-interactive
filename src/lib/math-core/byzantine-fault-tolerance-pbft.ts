/**
 * PBFT tolerates *Byzantine* replicas — ones that crash, but also ones that lie, equivocate, or send
 * conflicting messages to different peers. Crash-fault protocols like Raft only need a simple majority
 * (N = 2f+1) because a crashed node just stays silent. A Byzantine node can actively vote both ways, so
 * PBFT needs a bigger cluster (N = 3f+1) and a bigger per-phase quorum (2f+1 out of 3f+1, not just a
 * majority) so that any two quorums are still forced to share at least one *honest* replica.
 *
 * Two phases after the primary's proposal — PREPARE, then COMMIT — each require a replica to collect
 * 2f+1 matching votes (its own plus 2f others) before moving on. That's small enough, for f=1, to trace
 * by hand across 4 replicas.
 */

/** The smallest cluster size that can survive f simultaneously Byzantine replicas. */
export function minReplicasFor(f: number): number {
  return 3 * f + 1;
}

/** The most Byzantine replicas a cluster of size n can survive. */
export function maxToleratedFaults(n: number): number {
  return Math.floor((n - 1) / 3);
}

/** Whether a cluster of size n has enough replicas to tolerate f Byzantine faults. */
export function isSufficientReplicaCount(n: number, f: number): boolean {
  return n >= minReplicasFor(f);
}

/** How many matching votes a replica must collect in PREPARE or COMMIT before it can proceed. */
export function quorumSize(f: number): number {
  return 2 * f + 1;
}

/** How many replicas any two quorums of the given size out of n are guaranteed to share, worst case. */
export function quorumOverlap(n: number, q: number): number {
  return 2 * q - n;
}

/** Whether that guaranteed overlap is big enough to force at least one *honest* replica into it. */
export function honestOverlapGuaranteed(f: number, overlap: number): boolean {
  return overlap > f;
}

export interface ReplicaVote {
  replicaId: string;
  /** The value/digest this replica reports agreeing on, or null if it stayed silent. */
  reportedValue: string | null;
}

/** How many replicas reported the given target value (a mismatched or silent replica doesn't count). */
export function countMatchingVotes(votes: ReplicaVote[], target: string): number {
  return votes.filter((v) => v.reportedValue === target).length;
}

/** Whether the matching-vote count clears the quorum a replica needs to advance to the next phase. */
export function hasQuorum(matchingVotes: number, f: number): boolean {
  return matchingVotes >= quorumSize(f);
}

export interface ProtocolStep {
  phase: 1 | 2 | 3;
  from: string;
  to: string;
  message: string;
  description: string;
}

/** The fixed scenario used throughout this chapter: 4 replicas, tolerating f=1 Byzantine fault. */
export const F = 1;
export const N = minReplicasFor(F); // 4
export const REPLICAS = ["R0", "R1", "R2", "R3"] as const;
export const PRIMARY: (typeof REPLICAS)[number] = "R0";
export const REQUEST_VALUE = "op-42";

/** PREPARE round: R3 is Byzantine and equivocates, reporting a value nobody else agreed to. */
export const PREPARE_VOTES: ReplicaVote[] = [
  { replicaId: "R0", reportedValue: REQUEST_VALUE },
  { replicaId: "R1", reportedValue: REQUEST_VALUE },
  { replicaId: "R2", reportedValue: REQUEST_VALUE },
  { replicaId: "R3", reportedValue: "op-fake" },
];

/** COMMIT round: same three honest replicas agree; R3 goes silent this time instead. */
export const COMMIT_VOTES: ReplicaVote[] = [
  { replicaId: "R0", reportedValue: REQUEST_VALUE },
  { replicaId: "R1", reportedValue: REQUEST_VALUE },
  { replicaId: "R2", reportedValue: REQUEST_VALUE },
  { replicaId: "R3", reportedValue: null },
];

/** The full PRE-PREPARE / PREPARE / COMMIT message trace for the fixed scenario above. */
export function buildTrace(prepareVotes: ReplicaVote[], commitVotes: ReplicaVote[]): ProtocolStep[] {
  const steps: ProtocolStep[] = [];
  const backups = REPLICAS.filter((r) => r !== PRIMARY);

  for (const b of backups) {
    steps.push({
      phase: 1,
      from: PRIMARY,
      to: b,
      message: `PRE-PREPARE(${REQUEST_VALUE})`,
      description: `${PRIMARY} proposes ${REQUEST_VALUE} to ${b}.`,
    });
  }
  for (const vote of prepareVotes) {
    const matches = vote.reportedValue === REQUEST_VALUE;
    steps.push({
      phase: 2,
      from: vote.replicaId,
      to: "all replicas",
      message: vote.reportedValue ? `PREPARE(${vote.reportedValue})` : "no PREPARE sent",
      description: matches
        ? `${vote.replicaId} broadcasts PREPARE matching the primary's proposal.`
        : `${vote.replicaId} sends a mismatched or missing PREPARE — Byzantine behavior.`,
    });
  }
  for (const vote of commitVotes) {
    const matches = vote.reportedValue === REQUEST_VALUE;
    steps.push({
      phase: 3,
      from: vote.replicaId,
      to: "all replicas",
      message: vote.reportedValue ? `COMMIT(${vote.reportedValue})` : "no COMMIT sent",
      description: matches
        ? `${vote.replicaId} broadcasts COMMIT — it collected a PREPARE quorum.`
        : `${vote.replicaId} sends a mismatched or missing COMMIT — Byzantine behavior.`,
    });
  }
  return steps;
}

export const TRACE = buildTrace(PREPARE_VOTES, COMMIT_VOTES);

export interface PbftRoundResult {
  prepareMatches: number;
  commitMatches: number;
  prepared: boolean;
  committed: boolean;
}

/** Runs the fixed scenario end to end: count matching votes each phase, and check both quorums. */
export function runPbftRound(f: number, prepareVotes: ReplicaVote[], commitVotes: ReplicaVote[]): PbftRoundResult {
  const prepareMatches = countMatchingVotes(prepareVotes, REQUEST_VALUE);
  const commitMatches = countMatchingVotes(commitVotes, REQUEST_VALUE);
  return {
    prepareMatches,
    commitMatches,
    prepared: hasQuorum(prepareMatches, f),
    committed: hasQuorum(prepareMatches, f) && hasQuorum(commitMatches, f),
  };
}
