/**
 * Two-phase commit (2PC): a coordinator plus a fixed set of 3 participants, small enough to trace
 * every message by hand. Phase 1 collects a vote from everyone; phase 2 broadcasts the resulting
 * decision. The only decision rule that matters: ALL must vote yes to commit — a single "no" (from
 * anyone) forces a global abort, no matter how many others voted yes.
 */

export type Vote = "yes" | "no";
export type Decision = "commit" | "abort";

export const PARTICIPANTS = ["P1", "P2", "P3"] as const;
export type ParticipantId = (typeof PARTICIPANTS)[number];

export type VoteMap = Record<ParticipantId, Vote>;

export interface ProtocolStep {
  phase: 1 | 2;
  from: string;
  to: string;
  message: string;
  description: string;
}

/** The 2PC decision rule: commit iff every participant voted yes; otherwise abort. */
export function decide(votes: VoteMap): Decision {
  return PARTICIPANTS.every((p) => votes[p] === "yes") ? "commit" : "abort";
}

/**
 * The full message trace for a given vote assignment: phase 1 is a vote-request/vote round trip with
 * every participant, phase 2 is the coordinator's decision broadcast plus acks. 3 participants x
 * (request + vote + decision + ack) = 12 steps, always, regardless of the votes.
 */
export function buildTrace(votes: VoteMap): ProtocolStep[] {
  const decision = decide(votes);
  const steps: ProtocolStep[] = [];

  for (const p of PARTICIPANTS) {
    steps.push({
      phase: 1,
      from: "Coordinator",
      to: p,
      message: "VOTE-REQUEST",
      description: `Coordinator asks ${p} to vote on the transaction.`,
    });
  }
  for (const p of PARTICIPANTS) {
    steps.push({
      phase: 1,
      from: p,
      to: "Coordinator",
      message: votes[p] === "yes" ? "VOTE-YES" : "VOTE-NO",
      description: `${p} votes ${votes[p].toUpperCase()}.`,
    });
  }
  for (const p of PARTICIPANTS) {
    steps.push({
      phase: 2,
      from: "Coordinator",
      to: p,
      message: decision === "commit" ? "GLOBAL-COMMIT" : "GLOBAL-ABORT",
      description: `Coordinator tells ${p} to ${decision.toUpperCase()}.`,
    });
  }
  for (const p of PARTICIPANTS) {
    steps.push({
      phase: 2,
      from: p,
      to: "Coordinator",
      message: "ACK",
      description: `${p} acknowledges the ${decision}.`,
    });
  }
  return steps;
}

export const ALL_YES_VOTES: VoteMap = { P1: "yes", P2: "yes", P3: "yes" };
export const P2_NO_VOTES: VoteMap = { P1: "yes", P2: "no", P3: "yes" };

export const ALL_YES_TRACE = buildTrace(ALL_YES_VOTES);
export const P2_NO_TRACE = buildTrace(P2_NO_VOTES);

/**
 * 2PC's single blocking point: a participant that has voted yes is holding its locks and can only
 * commit or abort once it hears the coordinator's decision. If the coordinator has crashed, that
 * participant cannot safely guess — it has no way to know whether some OTHER participant already
 * voted no (in which case guessing commit would be wrong) — so it is stuck blocked until the
 * coordinator recovers.
 */
export function isBlocked(votes: VoteMap, coordinatorAlive: boolean): boolean {
  const allVotedYesSoFar = PARTICIPANTS.every((p) => votes[p] === "yes");
  return allVotedYesSoFar && !coordinatorAlive;
}
