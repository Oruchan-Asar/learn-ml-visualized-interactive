/**
 * Multi-Paxos: run single-value Paxos once per log slot, but once a leader
 * is stable, every acceptor already trusts its proposal numbers — so the
 * prepare/promise phase (Phase 1) can be skipped entirely for every
 * decision after the first. Only accept/accepted (Phase 2) is needed.
 *
 * We count messages in units of "round trips": a full Phase 1 + Phase 2
 * round costs 4 message-hops (prepare, promise, accept, accepted); an
 * accept-only round under a stable leader costs 2 (accept, accepted).
 */

/** Plain Paxos: every decision pays for both phases. */
export function plainPaxosMessages(decisions: number): number {
  return 4 * Math.max(0, decisions);
}

/** Multi-Paxos with a stable leader: only the first decision pays for Phase 1. */
export function multiPaxosMessages(decisions: number): number {
  if (decisions <= 0) return 0;
  return 4 + 2 * (decisions - 1);
}

/** Messages saved by Multi-Paxos over plain Paxos for the same number of decisions. */
export function messagesSaved(decisions: number): number {
  return plainPaxosMessages(decisions) - multiPaxosMessages(decisions);
}

/**
 * If the leader changes mid-stream, each change forces one more decision to
 * re-pay the Phase 1 cost (an extra 2 message-hops beyond what an
 * accept-only decision would have cost).
 */
export function multiPaxosMessagesWithLeaderChanges(decisions: number, leaderChanges: number): number {
  return multiPaxosMessages(decisions) + 2 * Math.max(0, leaderChanges);
}
