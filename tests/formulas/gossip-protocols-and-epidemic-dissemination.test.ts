import { describe, it, expect } from "vitest";
import {
  NUM_NODES,
  NEIGHBORS,
  gossipTargets,
  gossipStep,
  runGossip,
  roundsToFullCoverage,
} from "@/lib/math-core/gossip-protocols-and-epidemic-dissemination";

describe("the fixed 8-node gossip graph", () => {
  it("is symmetric — every edge appears in both endpoints' neighbor lists", () => {
    for (let i = 0; i < NUM_NODES; i++) {
      for (const j of NEIGHBORS[i]) {
        expect(NEIGHBORS[j]).toContain(i);
      }
    }
  });

  it("every node has exactly 3 neighbors", () => {
    for (let i = 0; i < NUM_NODES; i++) {
      expect(NEIGHBORS[i].length).toBe(3);
    }
  });
});

describe("gossipTargets rotates through neighbors by round", () => {
  it("fanout 1 from node 0 cycles through all three neighbors as rounds advance", () => {
    expect(gossipTargets(0, 0, 1)).toEqual([1]);
    expect(gossipTargets(0, 1, 1)).toEqual([4]);
    expect(gossipTargets(0, 2, 1)).toEqual([7]);
    expect(gossipTargets(0, 3, 1)).toEqual([1]); // period 3, back to the start
  });

  it("fanout 3 (== degree) always returns every neighbor regardless of round", () => {
    expect(gossipTargets(2, 0, 3)).toEqual([1, 3, 6]);
    expect(gossipTargets(2, 1, 3)).toEqual([3, 6, 1]);
  });
});

describe("runGossip with fanout 2 reaches full coverage in exactly 3 rounds", () => {
  it("matches the hand-traced infected sets round by round", () => {
    const history = runGossip(2, 3);
    expect(history[0]).toEqual([0]);
    expect(history[1]).toEqual([0, 1, 4]);
    expect(history[2]).toEqual([0, 1, 2, 3, 4, 5, 7]);
    expect(history[3]).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});

describe("runGossip with fanout 1 takes exactly 5 rounds", () => {
  it("matches the hand-traced infected sets, stalling on node 3 until round 5", () => {
    const history = runGossip(1, 5);
    expect(history[1]).toEqual([0, 1]);
    expect(history[2]).toEqual([0, 1, 2, 4]);
    expect(history[3]).toEqual([0, 1, 2, 4, 5, 6, 7]);
    expect(history[4]).toEqual([0, 1, 2, 4, 5, 6, 7]); // stalls — no new node this round
    expect(history[5]).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});

describe("runGossip with fanout 3 (full flooding) reaches full coverage in exactly 2 rounds", () => {
  it("matches the hand-traced infected sets", () => {
    const history = runGossip(3, 2);
    expect(history[1]).toEqual([0, 1, 4, 7]);
    expect(history[2]).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});

describe("roundsToFullCoverage", () => {
  it("decreases monotonically as fanout increases", () => {
    expect(roundsToFullCoverage(1)).toBe(5);
    expect(roundsToFullCoverage(2)).toBe(3);
    expect(roundsToFullCoverage(3)).toBe(2);
  });

  it("a start node other than 0 also reaches full coverage (graph is symmetric/vertex-transitive)", () => {
    expect(roundsToFullCoverage(2, 5)).toBe(3);
  });
});

describe("invariants", () => {
  it("infected set never shrinks round over round", () => {
    const history = runGossip(1, 5);
    for (let i = 1; i < history.length; i++) {
      expect(history[i].length).toBeGreaterThanOrEqual(history[i - 1].length);
    }
  });

  it("gossipStep never removes the starting node", () => {
    const step = gossipStep(new Set([0]), 0, 2);
    expect(step.has(0)).toBe(true);
  });
});
