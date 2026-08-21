import { describe, it, expect } from "vitest";
import {
  initialFeatures,
  gcnRound,
  gatRound,
  embed,
  predictProperty,
  RING_EDGES,
  CHAIN_EDGES,
  STAR_EDGES,
} from "@/lib/math-core/capstone-predict-a-molecules-property";

describe("gcnRound", () => {
  it("matches the hand-computed round-1 values for the ring structure", () => {
    const round1 = gcnRound(RING_EDGES, initialFeatures());
    expect(round1).toEqual({ "0": 1, "1": 1.5, "2": 1, "3": 2, "4": 2, "5": 2.5 });
  });
});

describe("embed (GCN layer, then GAT layer)", () => {
  it("matches the hand-computed two-layer value for atom 0 on the ring", () => {
    // GCN round1 for atom 0's neighborhood {0,1,2}: (1+2+0)/3=1, {1:1.5,2:1}(computed alongside)
    // GAT round2 on those GCN outputs: self=1, neighbor1=1.5, neighbor2=1
    const gcn1 = gcnRound(RING_EDGES, initialFeatures());
    const gat2 = gatRound(RING_EDGES, gcn1);
    expect(embed(RING_EDGES)["0"]).toBeCloseTo(gat2["0"], 10);
    expect(embed(RING_EDGES)["0"]).toBeCloseTo(1.2259, 3);
  });
});

describe("predictProperty", () => {
  it("gives three different predictions for three different bond structures on the exact same atoms", () => {
    const ring = predictProperty(RING_EDGES);
    const chain = predictProperty(CHAIN_EDGES);
    const star = predictProperty(STAR_EDGES);
    expect(ring).toBeCloseTo(10.278, 2);
    expect(chain).toBeCloseTo(9.2505, 3);
    expect(star).toBeCloseTo(9.9971, 3);
    expect(new Set([ring, chain, star]).size).toBe(3);
  });

  it("the ring predicts the highest property of the three structures", () => {
    const ring = predictProperty(RING_EDGES);
    const chain = predictProperty(CHAIN_EDGES);
    const star = predictProperty(STAR_EDGES);
    expect(ring).toBeGreaterThan(star);
    expect(star).toBeGreaterThan(chain);
  });

  it("would be identical across structures if the readout only summed raw features, ignoring bonds entirely", () => {
    const rawSum = Object.values(initialFeatures()).reduce((a, b) => a + b, 0);
    expect(rawSum).toBe(9);
    // but the actual (bond-aware) predictions all differ from that raw sum and from each other
    expect(predictProperty(RING_EDGES)).not.toBeCloseTo(rawSum, 1);
    expect(predictProperty(CHAIN_EDGES)).not.toBeCloseTo(rawSum, 1);
  });
});
