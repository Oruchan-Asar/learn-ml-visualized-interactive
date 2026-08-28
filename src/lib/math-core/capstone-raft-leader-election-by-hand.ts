/**
 * Capstone: a harder, two-round Raft election traced across a 5-node cluster, built entirely out of
 * chapter 1's primitives (`decideVote` via `runElection`, `hasMajority`, `electionOutcome`) — nothing
 * here reimplements the voting rule. The scenario: two nodes time out and become candidates in the
 * *same* term (a classic split vote), because their randomized election timers fired close together.
 * Which candidate each voter grants depends on which RequestVote message physically arrives first —
 * once a voter has granted a vote in a term, it refuses every other candidate in that same term, even
 * one with an equally good log.
 */

import {
  runElection,
  hasMajority,
  electionOutcome,
  type VoteRequest,
  type VoterState,
  type ElectionTrace,
} from "./raft-consensus";

export const CLUSTER_SIZE = 5;

/** Term 6: N1 and N3 both time out and become candidates simultaneously. */
export const TERM_6_N1_REQUEST: VoteRequest = { candidateId: "N1", term: 6, lastLog: { term: 5, index: 20 } };
export const TERM_6_N3_REQUEST: VoteRequest = { candidateId: "N3", term: 6, lastLog: { term: 5, index: 19 } };

/**
 * Each remaining voter's state at the moment N1's request reaches it. N4 has already granted N3 (its
 * RequestVote arrived first there); N2 and N5 haven't voted yet.
 */
export const TERM_6_VOTERS_FOR_N1: VoterState[] = [
  { id: "N2", currentTerm: 5, votedFor: null, lastLog: { term: 5, index: 20 } },
  { id: "N4", currentTerm: 5, votedFor: "N3", lastLog: { term: 5, index: 17 } },
  { id: "N5", currentTerm: 5, votedFor: null, lastLog: { term: 5, index: 21 } },
];

/**
 * Each remaining voter's state at the moment N3's request reaches it. N2 has already granted N1 (its
 * RequestVote arrived first there); N4 and N5 haven't voted yet.
 */
export const TERM_6_VOTERS_FOR_N3: VoterState[] = [
  { id: "N2", currentTerm: 5, votedFor: "N1", lastLog: { term: 5, index: 20 } },
  { id: "N4", currentTerm: 5, votedFor: null, lastLog: { term: 5, index: 17 } },
  { id: "N5", currentTerm: 5, votedFor: null, lastLog: { term: 5, index: 21 } },
];

/** N1's term-6 election, run through the exact same `runElection` from chapter 1. */
export const TERM_6_N1_TRACE: ElectionTrace = runElection(TERM_6_N1_REQUEST, TERM_6_VOTERS_FOR_N1, CLUSTER_SIZE);
/** N3's term-6 election — same function, different request and voter snapshot. */
export const TERM_6_N3_TRACE: ElectionTrace = runElection(TERM_6_N3_REQUEST, TERM_6_VOTERS_FOR_N3, CLUSTER_SIZE);

/**
 * Term 7: everyone's currentTerm has bumped to 6 (from seeing a term-6 request) and votedFor resets
 * for the new term. N1 tries again with the same log it had before — nobody advanced the log, because
 * no leader was ever elected in term 6 to replicate anything.
 */
export const TERM_7_N1_REQUEST: VoteRequest = { candidateId: "N1", term: 7, lastLog: { term: 5, index: 20 } };
export const TERM_7_VOTERS: VoterState[] = [
  { id: "N2", currentTerm: 6, votedFor: null, lastLog: { term: 5, index: 20 } },
  { id: "N3", currentTerm: 6, votedFor: null, lastLog: { term: 5, index: 19 } },
  { id: "N4", currentTerm: 6, votedFor: null, lastLog: { term: 5, index: 17 } },
  { id: "N5", currentTerm: 6, votedFor: null, lastLog: { term: 5, index: 21 } },
];
export const TERM_7_TRACE: ElectionTrace = runElection(TERM_7_N1_REQUEST, TERM_7_VOTERS, CLUSTER_SIZE);

/** True if every trace in the list failed to reach a majority — a genuine split vote. */
export function isSplitVote(traces: ElectionTrace[]): boolean {
  return traces.every((t) => t.winner === null);
}

/** True if exactly one trace in the list produced a winner. */
export function isResolved(traces: ElectionTrace[]): boolean {
  return traces.filter((t) => t.winner !== null).length === 1;
}

export { hasMajority, electionOutcome };
