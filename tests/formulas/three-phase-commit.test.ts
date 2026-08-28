import { describe, it, expect } from "vitest";
import {
  decide,
  roundTrips,
  safeDefaultOnTimeout,
  ALL_YES_VOTES,
  P2_NO_VOTES,
  ALL_YES_TRACE,
  P2_NO_TRACE,
} from "@/lib/math-core/three-phase-commit";

describe("the commit decision rule", () => {
  it("commits only when every participant votes yes", () => {
    expect(decide(ALL_YES_VOTES)).toBe("commit");
  });

  it("aborts on a single no", () => {
    expect(decide(P2_NO_VOTES)).toBe("abort");
  });
});

describe("the message trace has 3 phases on the commit path, 2 on the abort path", () => {
  it("commit path: 18 steps — vote (6) + pre-commit (6) + commit (6)", () => {
    expect(ALL_YES_TRACE.length).toBe(18);
    expect(ALL_YES_TRACE.filter((s) => s.phase === 1).length).toBe(6);
    expect(ALL_YES_TRACE.filter((s) => s.phase === 2).length).toBe(6);
    expect(ALL_YES_TRACE.filter((s) => s.phase === 3).length).toBe(6);
  });

  it("commit path includes a PRE-COMMIT message to every participant before any GLOBAL-COMMIT", () => {
    const preCommits = ALL_YES_TRACE.filter((s) => s.message === "PRE-COMMIT");
    const commits = ALL_YES_TRACE.filter((s) => s.message === "GLOBAL-COMMIT");
    expect(preCommits.length).toBe(3);
    expect(commits.length).toBe(3);
    expect(ALL_YES_TRACE.indexOf(preCommits[2])).toBeLessThan(ALL_YES_TRACE.indexOf(commits[0]));
  });

  it("abort path: 12 steps — vote (6) + abort (6), no pre-commit phase at all", () => {
    expect(P2_NO_TRACE.length).toBe(12);
    expect(P2_NO_TRACE.some((s) => s.message === "PRE-COMMIT")).toBe(false);
    expect(P2_NO_TRACE.filter((s) => s.phase === 3).length).toBe(0);
  });
});

describe("round trips: 3PC costs one more than 2PC, but only on the commit path", () => {
  it("2PC always costs 2 round trips regardless of outcome", () => {
    expect(roundTrips("2pc", "commit")).toBe(2);
    expect(roundTrips("2pc", "abort")).toBe(2);
  });

  it("3PC costs 3 round trips to commit, but only 2 to abort", () => {
    expect(roundTrips("3pc", "commit")).toBe(3);
    expect(roundTrips("3pc", "abort")).toBe(2);
  });
});

describe("the safe timeout default that removes 2PC's blocking point", () => {
  it("an uncertain participant (voted, no pre-commit yet) safely defaults to abort", () => {
    expect(safeDefaultOnTimeout("uncertain")).toBe("abort");
  });

  it("a prepared participant (already got pre-commit) safely defaults to commit", () => {
    expect(safeDefaultOnTimeout("prepared")).toBe("commit");
  });
});
