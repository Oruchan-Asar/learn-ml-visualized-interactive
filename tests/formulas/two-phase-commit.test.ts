import { describe, it, expect } from "vitest";
import {
  PARTICIPANTS,
  decide,
  isBlocked,
  ALL_YES_VOTES,
  P2_NO_VOTES,
  ALL_YES_TRACE,
  P2_NO_TRACE,
  type VoteMap,
} from "@/lib/math-core/two-phase-commit";

describe("the commit decision rule", () => {
  it("commits when all 3 participants vote yes", () => {
    expect(decide(ALL_YES_VOTES)).toBe("commit");
  });

  it("aborts when a single participant votes no, even if the others voted yes", () => {
    expect(decide(P2_NO_VOTES)).toBe("abort");
  });

  it("aborts when every participant votes no", () => {
    const votes: VoteMap = { P1: "no", P2: "no", P3: "no" };
    expect(decide(votes)).toBe("abort");
  });

  it("aborts on exactly one no regardless of which participant it is", () => {
    expect(decide({ P1: "no", P2: "yes", P3: "yes" })).toBe("abort");
    expect(decide({ P1: "yes", P2: "yes", P3: "no" })).toBe("abort");
  });
});

describe("the message trace", () => {
  it("has exactly 12 steps for any vote assignment: 3 participants x 4 messages", () => {
    expect(ALL_YES_TRACE.length).toBe(12);
    expect(P2_NO_TRACE.length).toBe(12);
  });

  it("phase 1 is the vote-request/vote round trip, in order, before any phase 2 message", () => {
    const phases = ALL_YES_TRACE.map((s) => s.phase);
    expect(phases.slice(0, 6)).toEqual([1, 1, 1, 1, 1, 1]);
    expect(phases.slice(6)).toEqual([2, 2, 2, 2, 2, 2]);
  });

  it("broadcasts GLOBAL-COMMIT to every participant when the vote was unanimous yes", () => {
    const decisions = ALL_YES_TRACE.filter((s) => s.from === "Coordinator" && s.phase === 2).map((s) => s.message);
    expect(decisions).toEqual(["GLOBAL-COMMIT", "GLOBAL-COMMIT", "GLOBAL-COMMIT"]);
  });

  it("broadcasts GLOBAL-ABORT to every participant — including the ones that voted yes — when one voted no", () => {
    const decisions = P2_NO_TRACE.filter((s) => s.from === "Coordinator" && s.phase === 2).map((s) => s.message);
    expect(decisions).toEqual(["GLOBAL-ABORT", "GLOBAL-ABORT", "GLOBAL-ABORT"]);
  });

  it("records each participant's actual vote message in phase 1", () => {
    const p2Vote = P2_NO_TRACE.find((s) => s.from === "P2" && s.phase === 1 && s.to === "Coordinator");
    expect(p2Vote?.message).toBe("VOTE-NO");
  });
});

describe("the coordinator-crash blocking window", () => {
  it("is not blocked while the coordinator is alive, even if all voted yes", () => {
    expect(isBlocked(ALL_YES_VOTES, true)).toBe(false);
  });

  it("blocks a participant that voted yes once the coordinator crashes before deciding", () => {
    expect(isBlocked(ALL_YES_VOTES, false)).toBe(true);
  });

  it("is never blocked if a no vote already happened locally, even with the coordinator down — nothing to wait for", () => {
    expect(isBlocked(P2_NO_VOTES, false)).toBe(false);
  });

  it("PARTICIPANTS is fixed at exactly 3", () => {
    expect(PARTICIPANTS.length).toBe(3);
  });
});
