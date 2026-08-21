import { describe, it, expect } from "vitest";
import {
  initialFeatureMap,
  leakyRelu,
  attentionSet,
  attentionScore,
  attentionWeights,
  aggregateNode,
  aggregateRound,
  divergenceFromGCN,
  LEAKY_SLOPE,
} from "@/lib/math-core/graph-attention-networks";

describe("leakyRelu", () => {
  it("passes non-negative values through unchanged", () => {
    expect(leakyRelu(0)).toBe(0);
    expect(leakyRelu(2)).toBe(2);
  });

  it("scales negative values by the leaky slope instead of zeroing them", () => {
    expect(leakyRelu(-1)).toBeCloseTo(-LEAKY_SLOPE, 10);
    expect(leakyRelu(-2)).toBeCloseTo(-2 * LEAKY_SLOPE, 10);
  });
});

describe("attentionSet", () => {
  it("puts the node itself first, then its graph neighbors", () => {
    expect(attentionSet("4")).toEqual(["4", "3"]);
    expect(attentionSet("1")).toEqual(["1", "0", "2", "3"]);
  });
});

describe("attentionScore", () => {
  it("is zero for a node scored against itself", () => {
    const f = initialFeatureMap();
    expect(attentionScore("3", "3", f)).toBe(0);
  });

  it("grows unclamped when a neighbor's feature is larger", () => {
    // node 4 (feature 1) vs its neighbor 3 (feature 3): score = leakyRelu(3-1) = 2
    const f = initialFeatureMap();
    expect(attentionScore("4", "3", f)).toBeCloseTo(2, 10);
  });

  it("is only mildly negative when a neighbor's feature is smaller", () => {
    // node 3 (feature 3) vs neighbor 4 (feature 1): score = leakyRelu(1-3) = 0.2 * -2 = -0.4
    const f = initialFeatureMap();
    expect(attentionScore("3", "4", f)).toBeCloseTo(-0.4, 10);
  });
});

describe("attentionWeights", () => {
  it("sums to exactly 1 over the whole attention set", () => {
    const f = initialFeatureMap();
    for (const id of ["0", "1", "2", "3", "4", "5"]) {
      const w = attentionWeights(id, f);
      const total = Object.values(w).reduce((a, b) => a + b, 0);
      expect(total).toBeCloseTo(1, 10);
    }
  });

  it("gives a leaf's single higher-valued neighbor most of the weight", () => {
    // node 4: self=1, neighbor 3=3. scores: self=0, neighbor=leakyRelu(2)=2. softmax([0,2]).
    const f = initialFeatureMap();
    const w = attentionWeights("4", f);
    expect(w["4"]).toBeCloseTo(1 / (1 + Math.exp(2)), 10);
    expect(w["3"]).toBeCloseTo(Math.exp(2) / (1 + Math.exp(2)), 10);
    expect(w["3"]).toBeGreaterThan(0.8);
  });
});

describe("aggregateNode / aggregateRound", () => {
  it("matches the hand-computed round-1 value for node 1", () => {
    // scores vs self=2: node0=leakyRelu(-1)=-0.2, node2=leakyRelu(-2)=-0.4, node3=leakyRelu(1)=1, self=0
    // softmax([0,-0.2,-0.4,1]) weighted onto features [2,1,0,3]
    const f = initialFeatureMap();
    const exps = [Math.exp(0), Math.exp(-0.2), Math.exp(-0.4), Math.exp(1)];
    const sum = exps.reduce((a, b) => a + b, 0);
    const expected = (exps[0] * 2 + exps[1] * 1 + exps[2] * 0 + exps[3] * 3) / sum;
    expect(aggregateNode("1", f)).toBeCloseTo(expected, 10);
  });

  it("a hub whose own feature is already the neighborhood max moves less than GCN's flat mean would", () => {
    // node 3 (feature 3) is higher than every one of its neighbors (1=2, 4=1, 5=2), so it attends
    // mostly to itself and barely moves — unlike GCN's flat mean, which pulls it down toward 2.0
    // regardless of how much higher it started.
    const f = initialFeatureMap();
    const round1 = aggregateRound(f);
    expect(round1["3"]).toBeGreaterThan(2.0);
    expect(round1["3"]).toBeLessThan(3);
  });

  it("aggregateRound matches aggregateNode for every node", () => {
    const f = initialFeatureMap();
    const round1 = aggregateRound(f);
    for (const id of ["0", "1", "2", "3", "4", "5"]) {
      expect(round1[id]).toBeCloseTo(aggregateNode(id, f), 10);
    }
  });
});

describe("divergenceFromGCN", () => {
  it("is exactly zero difference between GAT and GCN only when a node's whole neighborhood already agrees", () => {
    const d = divergenceFromGCN();
    // no node's neighborhood is perfectly uniform in this graph, so every divergence is nonzero
    for (const id of ["0", "1", "2", "3", "4", "5"]) {
      expect(Math.abs(d[id])).toBeGreaterThan(0);
    }
  });

  it("the leaf with the larger feature gap to its neighbor diverges more than the leaf with the smaller gap", () => {
    // node 4: self=1, neighbor 3=3 -> gap 2. node 5: self=2, neighbor 3=3 -> gap 1.
    const d = divergenceFromGCN();
    expect(Math.abs(d["4"])).toBeGreaterThan(Math.abs(d["5"]));
  });
});
