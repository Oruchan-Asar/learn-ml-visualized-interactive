import { describe, it, expect } from "vitest";
import {
  RING_SIZE,
  NODE_IDS,
  NODE_POSITIONS,
  NEW_NODE_ID,
  NEW_NODE_POS,
  KEY_POS,
  ownerAccordingTo,
  fullyConverged,
} from "@/lib/math-core/capstone-gossip-based-key-value-store";
import { NUM_NODES, runGossip } from "@/lib/math-core/gossip-protocols-and-epidemic-dissemination";
import { incrementClock, mergeClocks, compareClocks } from "@/lib/math-core/dynamo-style-storage";

describe("the reused ring layout", () => {
  it("places exactly the gossip chapter's 8 nodes at round positions 0, 2, .. 14", () => {
    expect(NODE_IDS).toHaveLength(NUM_NODES);
    expect(NODE_IDS).toEqual(["0", "1", "2", "3", "4", "5", "6", "7"]);
    expect(NODE_POSITIONS).toEqual({ "0": 0, "1": 2, "2": 4, "3": 6, "4": 8, "5": 10, "6": 12, "7": 14 });
  });

  it("the new node and the tracked key both sit at position 15, past the last original node", () => {
    expect(NEW_NODE_POS).toBe(15);
    expect(KEY_POS).toBe(15);
    expect(NEW_NODE_ID).toBe("8");
    expect(RING_SIZE).toBe(16);
  });
});

describe("ownerAccordingTo — reuses consistent-hashing's assignKey directly", () => {
  it("without node 8, key@15 wraps around to node 0 (the smallest position on the ring)", () => {
    expect(ownerAccordingTo(false)).toBe("0");
  });

  it("once node 8 is part of the view, it owns key@15 outright (its own position)", () => {
    expect(ownerAccordingTo(true)).toBe("8");
  });
});

describe("fullyConverged", () => {
  it("is false until every one of the 8 original nodes has heard about node 8", () => {
    expect(fullyConverged(7)).toBe(false);
    expect(fullyConverged(0)).toBe(false);
  });

  it("is true only once the informed count reaches all 8", () => {
    expect(fullyConverged(8)).toBe(true);
  });
});

describe("end-to-end: gossip (reused as-is) driving ring-ownership agreement", () => {
  it("fanout 2 from node 0 needs exactly 3 rounds, exactly as in the gossip chapter, and only then does every node agree the owner is node 8", () => {
    const history = runGossip(2, 3, 0);
    expect(history[0]).toEqual([0]);
    expect(history[2]).toHaveLength(7); // one holdout left, per the gossip chapter's own worked example
    expect(history[3]).toHaveLength(8);
    expect(fullyConverged(history[3].length)).toBe(true);
    expect(fullyConverged(history[2].length)).toBe(false);

    // At round 2, the one still-uninformed node would still (correctly, from its own stale view) compute owner "0",
    // while every informed node already computes owner "8".
    const informedAtRound2 = new Set(history[2].map(String));
    const holdout = NODE_IDS.find((id) => !informedAtRound2.has(id))!;
    expect(holdout).toBeDefined();
    expect(ownerAccordingTo(informedAtRound2.has(holdout))).toBe("0");
    expect(ownerAccordingTo(informedAtRound2.has("0"))).toBe("8");
  });
});

describe("end-to-end: a concurrent write during the convergence window, reconciled with reused vector-clock functions", () => {
  it("node 0 (informed) and node 3 (not yet informed) write concurrently, then merge to a single agreed history", () => {
    const clock0 = incrementClock({}, "0");
    const clock3 = incrementClock({}, "3");
    expect(compareClocks(clock0, clock3)).toBe("concurrent");

    const merged = mergeClocks(clock0, clock3);
    expect(merged).toEqual({ "0": 1, "3": 1 });
    expect(compareClocks(merged, clock0)).toBe("after");
    expect(compareClocks(merged, clock3)).toBe("after");
  });
});
