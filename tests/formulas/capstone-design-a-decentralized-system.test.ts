import { describe, it, expect } from "vitest";
import { scoreDesign, isCoherentDesign, PASS_THRESHOLD } from "@/lib/math-core/capstone-design-a-decentralized-system";

describe("scoreDesign", () => {
  it("scores the optimal combination at the maximum, 100", () => {
    expect(scoreDesign({ consistency: "eventual", replication: "gossip", consensus: "none" })).toBe(100);
  });

  it("scores a still-coherent but non-maximal combination above threshold", () => {
    expect(scoreDesign({ consistency: "eventual", replication: "gossip", consensus: "raft" })).toBe(80);
    expect(scoreDesign({ consistency: "causal", replication: "gossip", consensus: "none" })).toBe(80);
  });

  it("scores an over-engineered, partition-intolerant combination deeply negative", () => {
    expect(scoreDesign({ consistency: "linearizability", replication: "primary-backup", consensus: "raft" })).toBe(-50);
    expect(scoreDesign({ consistency: "linearizability", replication: "quorum", consensus: "pbft" })).toBe(-45);
  });

  it("scores a reasonable-sounding but insufficient combination below threshold", () => {
    expect(scoreDesign({ consistency: "causal", replication: "quorum", consensus: "raft" })).toBe(35);
  });

  it("is a pure sum of three independent per-axis scores", () => {
    const a = scoreDesign({ consistency: "eventual", replication: "quorum", consensus: "none" });
    const b = scoreDesign({ consistency: "eventual", replication: "gossip", consensus: "none" });
    // swapping only the replication axis changes the score by exactly (40 - 15) = 25
    expect(b - a).toBe(25);
  });
});

describe("isCoherentDesign", () => {
  it("passes at exactly the threshold and above", () => {
    expect(PASS_THRESHOLD).toBe(70);
    expect(isCoherentDesign({ consistency: "eventual", replication: "gossip", consensus: "none" })).toBe(true);
    expect(isCoherentDesign({ consistency: "eventual", replication: "gossip", consensus: "raft" })).toBe(true);
  });

  it("fails below the threshold", () => {
    expect(isCoherentDesign({ consistency: "causal", replication: "quorum", consensus: "raft" })).toBe(false);
    expect(isCoherentDesign({ consistency: "linearizability", replication: "primary-backup", consensus: "raft" })).toBe(false);
  });
});
