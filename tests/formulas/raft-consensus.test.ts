import { describe, it, expect } from "vitest";
import {
  CLUSTER_SIZE,
  CANDIDATE_REQUEST,
  VOTERS,
  isLogAtLeastAsUpToDate,
  decideVote,
  tallyVotes,
  hasMajority,
  electionOutcome,
  runElection,
} from "@/lib/math-core/raft-consensus";

describe("isLogAtLeastAsUpToDate", () => {
  it("a higher candidate term wins outright, even with a shorter log", () => {
    expect(isLogAtLeastAsUpToDate({ term: 4, index: 5 }, { term: 3, index: 100 })).toBe(true);
  });

  it("a lower candidate term loses outright, even with a longer log", () => {
    expect(isLogAtLeastAsUpToDate({ term: 3, index: 100 }, { term: 4, index: 5 })).toBe(false);
  });

  it("with equal terms, falls back to comparing log length", () => {
    expect(isLogAtLeastAsUpToDate({ term: 4, index: 10 }, { term: 4, index: 9 })).toBe(true);
    expect(isLogAtLeastAsUpToDate({ term: 4, index: 9 }, { term: 4, index: 10 })).toBe(false);
  });

  it("equal terms and equal indices count as up to date (>=, not >)", () => {
    expect(isLogAtLeastAsUpToDate({ term: 4, index: 10 }, { term: 4, index: 10 })).toBe(true);
  });
});

describe("decideVote", () => {
  it("rejects a request from an older term than the voter's current term", () => {
    const voter = { id: "V", currentTerm: 5, votedFor: null, lastLog: { term: 1, index: 1 } };
    const request = { candidateId: "C", term: 4, lastLog: { term: 9, index: 9 } };
    expect(decideVote(voter, request)).toBe(false);
  });

  it("rejects a second candidate once the voter already voted for someone else this term", () => {
    const voter = { id: "V", currentTerm: 5, votedFor: "OTHER", lastLog: { term: 1, index: 1 } };
    const request = { candidateId: "C", term: 5, lastLog: { term: 9, index: 9 } };
    expect(decideVote(voter, request)).toBe(false);
  });

  it("grants when the candidate's log is at least as up to date and no conflicting vote exists", () => {
    const voter = { id: "V", currentTerm: 5, votedFor: null, lastLog: { term: 4, index: 10 } };
    const request = { candidateId: "C", term: 5, lastLog: { term: 4, index: 10 } };
    expect(decideVote(voter, request)).toBe(true);
  });
});

describe("the term-5 election scenario (CANDIDATE_REQUEST / VOTERS)", () => {
  it("matches the hand-worked per-voter grants: N2, N3, N4 grant; N5 rejects", () => {
    const trace = runElection(CANDIDATE_REQUEST, VOTERS, CLUSTER_SIZE);
    expect(trace.grants).toEqual({ N2: true, N3: true, N4: true, N5: false });
  });

  it("tallies to 4 total votes (1 self-vote + 3 grants) out of 5", () => {
    const trace = runElection(CANDIDATE_REQUEST, VOTERS, CLUSTER_SIZE);
    expect(trace.totalVotes).toBe(4);
  });

  it("N1 wins the term-5 election with a majority", () => {
    const trace = runElection(CANDIDATE_REQUEST, VOTERS, CLUSTER_SIZE);
    expect(trace.winner).toBe("N1");
  });
});

describe("tallyVotes / hasMajority / electionOutcome", () => {
  it("tallyVotes counts only the true entries", () => {
    expect(tallyVotes([true, false, true, true])).toBe(3);
  });

  it("hasMajority requires strictly more than half", () => {
    expect(hasMajority(3, 5)).toBe(true);
    expect(hasMajority(2, 5)).toBe(false);
  });

  it("electionOutcome returns null (split vote) when nobody has a majority", () => {
    expect(electionOutcome({ A: 2, B: 2 }, 5)).toBeNull();
  });

  it("electionOutcome returns the candidate id once it clears a majority", () => {
    expect(electionOutcome({ A: 3, B: 2 }, 5)).toBe("A");
  });
});
