import { describe, it, expect } from "vitest";
import { initialFeatureMap, aggregateRound, runRounds, variance } from "@/lib/math-core/message-passing-and-gcn";

describe("one round of mean aggregation", () => {
  it("matches the hand-computed round-1 values exactly", () => {
    const round1 = aggregateRound(initialFeatureMap());
    expect(round1).toEqual({
      "0": 1,
      "1": 1.5,
      "2": 1,
      "3": 2,
      "4": 2,
      "5": 2.5,
    });
  });

  it("a leaf's new value averages exactly 2 numbers (itself and its one neighbor)", () => {
    // node 4: self=1, neighbor 3=3 -> mean = (1+3)/2 = 2
    const round1 = aggregateRound(initialFeatureMap());
    expect(round1["4"]).toBeCloseTo(2, 10);
  });

  it("a hub's new value averages exactly 4 numbers (itself and three neighbors)", () => {
    // node 3: self=3, neighbors 1=2,4=1,5=2 -> mean = (3+2+1+2)/4 = 2
    const round1 = aggregateRound(initialFeatureMap());
    expect(round1["3"]).toBeCloseTo(2, 10);
  });
});

describe("running several rounds", () => {
  it("returns rounds+1 feature maps, starting with the raw input", () => {
    const history = runRounds(3);
    expect(history.length).toBe(4);
    expect(history[0]).toEqual(initialFeatureMap());
  });

  it("matches the hand-computed round-2 values", () => {
    const history = runRounds(2);
    const round2 = history[2];
    expect(round2["0"]).toBeCloseTo(7 / 6, 10);
    expect(round2["3"]).toBeCloseTo(2, 10);
    expect(round2["5"]).toBeCloseTo(2.25, 10);
  });
});

describe("variance shrinks monotonically as message passing over-smooths the graph", () => {
  it("strictly decreases across 4 rounds", () => {
    const history = runRounds(4);
    const variances = history.map(variance);
    expect(variances[0]).toBeCloseTo(11 / 12, 10);
    for (let i = 1; i < variances.length; i++) {
      expect(variances[i]).toBeLessThan(variances[i - 1]);
    }
  });

  it("far-apart nodes 0 and 5 start 1.0 apart and end up much closer after 4 rounds", () => {
    const history = runRounds(4);
    const first = history[0];
    const last = history[4];
    const startGap = Math.abs(first["0"] - first["5"]);
    const endGap = Math.abs(last["0"] - last["5"]);
    expect(startGap).toBe(1);
    expect(endGap).toBeLessThan(startGap);
  });
});
