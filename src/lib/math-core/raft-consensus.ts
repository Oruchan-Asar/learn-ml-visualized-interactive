/**
 * Raft's leader election, isolated to its decision logic. A candidate asks
 * for votes; each voter grants one based on two independent checks:
 *
 *  1. Term freshness — reject anything from an older term, and don't grant a
 *     second vote to a different candidate within the same term.
 *  2. Log up-to-dateness — the candidate's log must be at least as current
 *     as the voter's own, comparing the term of the last entry first and
 *     the length only as a tie-breaker.
 *
 * This module is deliberately the single source of truth for that decision:
 * the capstone chapter traces a harder, multi-candidate scenario by calling
 * these exact functions rather than re-implementing the rule.
 */

export interface LogPosition {
  /** The term the last log entry was written in. */
  term: number;
  /** The index of the last log entry. */
  index: number;
}

export interface VoteRequest {
  candidateId: string;
  term: number;
  lastLog: LogPosition;
}

export interface VoterState {
  id: string;
  currentTerm: number;
  /** Who this voter has already voted for in currentTerm, if anyone. */
  votedFor: string | null;
  lastLog: LogPosition;
}

/** Raft's log-comparison rule: higher term wins outright; equal terms fall back to log length. */
export function isLogAtLeastAsUpToDate(candidateLog: LogPosition, voterLog: LogPosition): boolean {
  if (candidateLog.term !== voterLog.term) return candidateLog.term > voterLog.term;
  return candidateLog.index >= voterLog.index;
}

/** Whether `voter` grants its vote to the candidate behind `request`. */
export function decideVote(voter: VoterState, request: VoteRequest): boolean {
  if (request.term < voter.currentTerm) return false;
  if (voter.votedFor !== null && voter.votedFor !== request.candidateId) return false;
  return isLogAtLeastAsUpToDate(request.lastLog, voter.lastLog);
}

/** How many of a list of vote decisions were grants. */
export function tallyVotes(votes: boolean[]): number {
  return votes.filter(Boolean).length;
}

/** More than half of a cluster of the given size. */
export function hasMajority(voteCount: number, clusterSize: number): boolean {
  return voteCount > clusterSize / 2;
}

/**
 * Given each candidate's total vote count (including its own self-vote) and
 * the cluster size, returns the winning candidate's id, or null if nobody
 * reached a majority this term — a split vote.
 */
export function electionOutcome(voteCounts: Record<string, number>, clusterSize: number): string | null {
  const winner = Object.entries(voteCounts).find(([, count]) => hasMajority(count, clusterSize));
  return winner ? winner[0] : null;
}

/** The 5-node cluster size used throughout this chapter's scenario. */
export const CLUSTER_SIZE = 5;

/** N1 becomes a candidate for term 5, having last written {term:4, index:10}. */
export const CANDIDATE_REQUEST: VoteRequest = {
  candidateId: "N1",
  term: 5,
  lastLog: { term: 4, index: 10 },
};

/** The other four voters' state at the moment N1's RequestVote arrives. */
export const VOTERS: VoterState[] = [
  { id: "N2", currentTerm: 5, votedFor: null, lastLog: { term: 4, index: 10 } }, // equal log -> grant
  { id: "N3", currentTerm: 5, votedFor: null, lastLog: { term: 3, index: 12 } }, // lower term wins on term alone -> grant
  { id: "N4", currentTerm: 5, votedFor: null, lastLog: { term: 4, index: 9 } }, // behind -> grant
  { id: "N5", currentTerm: 5, votedFor: null, lastLog: { term: 4, index: 11 } }, // ahead in the same term -> reject
];

export interface ElectionTrace {
  grants: Record<string, boolean>;
  /** Total votes for the candidate, including its own self-vote. */
  totalVotes: number;
  winner: string | null;
}

/** Runs the fixed N1-for-term-5 scenario end to end using the primitives above. */
export function runElection(request: VoteRequest, voters: VoterState[], clusterSize: number): ElectionTrace {
  const grants: Record<string, boolean> = {};
  for (const voter of voters) grants[voter.id] = decideVote(voter, request);
  const totalVotes = 1 + tallyVotes(Object.values(grants)); // +1 for the candidate's own self-vote
  const winner = electionOutcome({ [request.candidateId]: totalVotes }, clusterSize);
  return { grants, totalVotes, winner };
}
