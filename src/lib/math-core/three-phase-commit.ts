/**
 * Three-phase commit (3PC): the same 3-participant vote as 2PC, but with an extra PRE-COMMIT phase
 * inserted between the vote and the final decision. That phase exists for exactly one reason: it
 * gives a participant enough information to safely guess the outcome on its own if the coordinator
 * disappears, removing 2PC's single blocking point (at the cost of one more network round trip).
 */

export type Vote = "yes" | "no";
export type Decision = "commit" | "abort";

export const PARTICIPANTS = ["P1", "P2", "P3"] as const;
export type ParticipantId = (typeof PARTICIPANTS)[number];
export type VoteMap = Record<ParticipantId, Vote>;

export interface ProtocolStep {
  phase: 1 | 2 | 3;
  from: string;
  to: string;
  message: string;
  description: string;
}

/** Same rule as 2PC: commit iff every participant voted yes. */
export function decide(votes: VoteMap): Decision {
  return PARTICIPANTS.every((p) => votes[p] === "yes") ? "commit" : "abort";
}

/**
 * The full message trace. If the vote aborts, there's nothing to pre-commit — phase 1 (vote) is
 * followed directly by an abort broadcast, exactly like 2PC (8 steps: 3 requests + 3 votes + 3
 * aborts... but see buildTrace's shape below — abort skips phase 2 entirely). If the vote commits,
 * a PRE-COMMIT phase is inserted before the final COMMIT phase (16 steps: 3 requests + 3 votes + 3
 * pre-commits + 3 pre-commit-acks + 3 commits + 3 commit-acks... trimmed to what's actually needed).
 */
export function buildTrace(votes: VoteMap): ProtocolStep[] {
  const decision = decide(votes);
  const steps: ProtocolStep[] = [];

  for (const p of PARTICIPANTS) {
    steps.push({ phase: 1, from: "Coordinator", to: p, message: "VOTE-REQUEST", description: `Coordinator asks ${p} to vote.` });
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

  if (decision === "abort") {
    for (const p of PARTICIPANTS) {
      steps.push({ phase: 2, from: "Coordinator", to: p, message: "ABORT", description: `Coordinator tells ${p} to abort — no pre-commit needed.` });
    }
    for (const p of PARTICIPANTS) {
      steps.push({ phase: 2, from: p, to: "Coordinator", message: "ACK", description: `${p} acknowledges the abort.` });
    }
    return steps;
  }

  for (const p of PARTICIPANTS) {
    steps.push({
      phase: 2,
      from: "Coordinator",
      to: p,
      message: "PRE-COMMIT",
      description: `Coordinator tells ${p}: everyone voted yes, prepare to commit.`,
    });
  }
  for (const p of PARTICIPANTS) {
    steps.push({ phase: 2, from: p, to: "Coordinator", message: "PRE-COMMIT-ACK", description: `${p} acknowledges — it is now PREPARED.` });
  }
  for (const p of PARTICIPANTS) {
    steps.push({ phase: 3, from: "Coordinator", to: p, message: "GLOBAL-COMMIT", description: `Coordinator tells ${p} to commit.` });
  }
  for (const p of PARTICIPANTS) {
    steps.push({ phase: 3, from: p, to: "Coordinator", message: "ACK", description: `${p} acknowledges the commit.` });
  }
  return steps;
}

export const ALL_YES_VOTES: VoteMap = { P1: "yes", P2: "yes", P3: "yes" };
export const P2_NO_VOTES: VoteMap = { P1: "yes", P2: "no", P3: "yes" };

export const ALL_YES_TRACE = buildTrace(ALL_YES_VOTES);
export const P2_NO_TRACE = buildTrace(P2_NO_VOTES);

/** How many coordinator-to-participant round trips a given decision actually needs. */
export function roundTrips(protocol: "2pc" | "3pc", decision: Decision): number {
  if (protocol === "2pc") return 2; // vote, then decide — always, commit or abort
  return decision === "commit" ? 3 : 2; // 3PC only pays for the extra pre-commit round trip on the commit path
}

/**
 * A participant's local state at the moment it notices the coordinator is unreachable. "uncertain"
 * means it voted but has heard nothing back yet; "prepared" means it already received PRE-COMMIT.
 */
export type ParticipantState = "uncertain" | "prepared";

/**
 * The safe default a stuck participant can pick on its own, without hearing from the coordinator —
 * this is exactly what removes 2PC's blocking point.
 *
 * - "uncertain": no participant could have committed yet (pre-commit hadn't gone out), so aborting
 *   is always safe.
 * - "prepared": PRE-COMMIT is only ever sent after every participant voted yes, so every other
 *   participant is at least prepared too — committing is always safe.
 */
export function safeDefaultOnTimeout(state: ParticipantState): Decision {
  return state === "prepared" ? "commit" : "abort";
}
