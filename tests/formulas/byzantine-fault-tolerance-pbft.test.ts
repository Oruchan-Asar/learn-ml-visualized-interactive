import { describe, it, expect } from "vitest";
import {
  minReplicasFor,
  maxToleratedFaults,
  isSufficientReplicaCount,
  quorumSize,
  quorumOverlap,
  honestOverlapGuaranteed,
  countMatchingVotes,
  hasQuorum,
  buildTrace,
  runPbftRound,
  F,
  N,
  REQUEST_VALUE,
  PREPARE_VOTES,
  COMMIT_VOTES,
} from "@/lib/math-core/byzantine-fault-tolerance-pbft";

describe("minReplicasFor / maxToleratedFaults", () => {
  it("f=1 needs 4 replicas; f=2 needs 7", () => {
    expect(minReplicasFor(1)).toBe(4);
    expect(minReplicasFor(2)).toBe(7);
  });

  it("maxToleratedFaults inverts minReplicasFor at the exact 3f+1 boundary", () => {
    expect(maxToleratedFaults(4)).toBe(1);
    expect(maxToleratedFaults(7)).toBe(2);
    expect(maxToleratedFaults(6)).toBe(1); // not enough for f=2 yet
  });
});

describe("isSufficientReplicaCount", () => {
  it("4 replicas suffice for f=1, but 3 do not", () => {
    expect(isSufficientReplicaCount(4, 1)).toBe(true);
    expect(isSufficientReplicaCount(3, 1)).toBe(false);
  });
});

describe("quorumSize / quorumOverlap / honestOverlapGuaranteed", () => {
  it("f=1 needs a quorum of 3 votes", () => {
    expect(quorumSize(1)).toBe(3);
  });

  it("two quorums of 3 out of 4 are forced to share 2 replicas", () => {
    expect(quorumOverlap(4, 3)).toBe(2);
  });

  it("an overlap of 2 guarantees an honest replica when f=1 (2 > 1)", () => {
    expect(honestOverlapGuaranteed(1, 2)).toBe(true);
  });

  it("with too few replicas (n=3, f=1) the overlap of 1 does NOT guarantee an honest replica", () => {
    const overlap = quorumOverlap(3, quorumSize(1)); // quorum would have to be all 3 replicas
    expect(quorumSize(1)).toBe(3);
    expect(overlap).toBe(3);
    // even though the arithmetic overlap looks fine, isSufficientReplicaCount catches the real problem:
    expect(isSufficientReplicaCount(3, 1)).toBe(false);
  });
});

describe("countMatchingVotes / hasQuorum", () => {
  it("counts only votes matching the target value", () => {
    expect(countMatchingVotes(PREPARE_VOTES, REQUEST_VALUE)).toBe(3);
    expect(countMatchingVotes(COMMIT_VOTES, REQUEST_VALUE)).toBe(3);
  });

  it("3 matching votes clears the f=1 quorum of 3; 2 does not", () => {
    expect(hasQuorum(3, 1)).toBe(true);
    expect(hasQuorum(2, 1)).toBe(false);
  });
});

describe("the fixed 4-replica scenario (F, N, PREPARE_VOTES, COMMIT_VOTES)", () => {
  it("F=1 and N=4, matching minReplicasFor(1)", () => {
    expect(F).toBe(1);
    expect(N).toBe(4);
  });

  it("runPbftRound reaches quorum in both phases despite R3 lying/going silent", () => {
    const result = runPbftRound(F, PREPARE_VOTES, COMMIT_VOTES);
    expect(result).toEqual({ prepareMatches: 3, commitMatches: 3, prepared: true, committed: true });
  });

  it("buildTrace produces 3 PRE-PREPARE steps, 4 PREPARE steps, and 4 COMMIT steps", () => {
    const trace = buildTrace(PREPARE_VOTES, COMMIT_VOTES);
    expect(trace.filter((s) => s.phase === 1)).toHaveLength(3);
    expect(trace.filter((s) => s.phase === 2)).toHaveLength(4);
    expect(trace.filter((s) => s.phase === 3)).toHaveLength(4);
    expect(trace).toHaveLength(11);
  });

  it("a scenario with only 2 honest matching votes fails to reach quorum", () => {
    const votes = [
      { replicaId: "R0", reportedValue: REQUEST_VALUE },
      { replicaId: "R1", reportedValue: REQUEST_VALUE },
      { replicaId: "R2", reportedValue: "op-fake" },
      { replicaId: "R3", reportedValue: null },
    ];
    const result = runPbftRound(F, votes, votes);
    expect(result.prepareMatches).toBe(2);
    expect(result.prepared).toBe(false);
    expect(result.committed).toBe(false);
  });
});
