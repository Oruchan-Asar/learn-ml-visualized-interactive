import { describe, it, expect } from "vitest";
import {
  CLUSTER_SIZE,
  TERM_6_N1_REQUEST,
  TERM_6_N3_REQUEST,
  TERM_6_VOTERS_FOR_N1,
  TERM_6_VOTERS_FOR_N3,
  TERM_6_N1_TRACE,
  TERM_6_N3_TRACE,
  TERM_7_N1_REQUEST,
  TERM_7_VOTERS,
  TERM_7_TRACE,
  isSplitVote,
  isResolved,
} from "@/lib/math-core/capstone-raft-leader-election-by-hand";
import { runElection, hasMajority } from "@/lib/math-core/raft-consensus";

describe("term 6 — N1's request, reusing runElection from chapter 1", () => {
  it("N2 grants (equal log), N4 already voted N3 so rejects, N5 is ahead so rejects", () => {
    expect(TERM_6_N1_TRACE.grants).toEqual({ N2: true, N4: false, N5: false });
  });

  it("N1 only reaches 2 total votes (self + N2) out of 5 — no majority", () => {
    expect(TERM_6_N1_TRACE.totalVotes).toBe(2);
    expect(hasMajority(2, CLUSTER_SIZE)).toBe(false);
    expect(TERM_6_N1_TRACE.winner).toBeNull();
  });

  it("matches calling runElection directly with the same request and voters", () => {
    expect(runElection(TERM_6_N1_REQUEST, TERM_6_VOTERS_FOR_N1, CLUSTER_SIZE)).toEqual(TERM_6_N1_TRACE);
  });
});

describe("term 6 — N3's request, same term, different voter snapshot", () => {
  it("N2 already voted N1 so rejects, N4 grants (ahead of its own log), N5 is ahead so rejects", () => {
    expect(TERM_6_N3_TRACE.grants).toEqual({ N2: false, N4: true, N5: false });
  });

  it("N3 also only reaches 2 total votes out of 5 — no majority either", () => {
    expect(TERM_6_N3_TRACE.totalVotes).toBe(2);
    expect(TERM_6_N3_TRACE.winner).toBeNull();
  });

  it("matches calling runElection directly", () => {
    expect(runElection(TERM_6_N3_REQUEST, TERM_6_VOTERS_FOR_N3, CLUSTER_SIZE)).toEqual(TERM_6_N3_TRACE);
  });
});

describe("isSplitVote", () => {
  it("term 6 is a genuine split vote — neither N1 nor N3 wins", () => {
    expect(isSplitVote([TERM_6_N1_TRACE, TERM_6_N3_TRACE])).toBe(true);
  });
});

describe("term 7 — N1 retries alone after the split vote", () => {
  it("N2, N3, and N4 all grant; only N5 (still ahead in the log) rejects", () => {
    expect(TERM_7_TRACE.grants).toEqual({ N2: true, N3: true, N4: true, N5: false });
  });

  it("N1 collects 4 of 5 total votes and wins", () => {
    expect(TERM_7_TRACE.totalVotes).toBe(4);
    expect(hasMajority(4, CLUSTER_SIZE)).toBe(true);
    expect(TERM_7_TRACE.winner).toBe("N1");
  });

  it("matches calling runElection directly", () => {
    expect(runElection(TERM_7_N1_REQUEST, TERM_7_VOTERS, CLUSTER_SIZE)).toEqual(TERM_7_TRACE);
  });
});

describe("isResolved", () => {
  it("is false across the two term-6 traces (both split)", () => {
    expect(isResolved([TERM_6_N1_TRACE, TERM_6_N3_TRACE])).toBe(false);
  });

  it("is true once term 7's trace is included (exactly one winner)", () => {
    expect(isResolved([TERM_6_N1_TRACE, TERM_6_N3_TRACE, TERM_7_TRACE])).toBe(true);
  });
});
