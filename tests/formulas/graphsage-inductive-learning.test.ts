import { describe, it, expect } from "vitest";
import { initialFeatureMap } from "@/lib/math-core/message-passing-and-gcn";
import {
  sampleNeighbors,
  sampledAggregate,
  fullAggregate,
  newNodeAggregate,
  SAMPLE_SIZE,
} from "@/lib/math-core/graphsage-inductive-learning";

describe("neighbor sampling", () => {
  it("keeps all neighbors when there are SAMPLE_SIZE or fewer", () => {
    expect(sampleNeighbors("0")).toEqual(["1", "2"]);
    expect(sampleNeighbors("4")).toEqual(["3"]);
  });

  it("truncates to exactly SAMPLE_SIZE for a higher-degree node, in sorted order", () => {
    const sample = sampleNeighbors("1");
    expect(sample.length).toBe(SAMPLE_SIZE);
    expect(sample).toEqual(["0", "2"]);
  });
});

describe("sampled vs. full aggregation", () => {
  it("agree exactly for a node with degree <= SAMPLE_SIZE", () => {
    const features = initialFeatureMap();
    expect(sampledAggregate(features, "0")).toBeCloseTo(fullAggregate(features, "0"), 10);
    expect(sampledAggregate(features, "0")).toBeCloseTo(1, 10);
  });

  it("genuinely differ for a node with more neighbors than the sample size", () => {
    const features = initialFeatureMap();
    const sampled = sampledAggregate(features, "1");
    const full = fullAggregate(features, "1");
    expect(sampled).toBeCloseTo(1, 10);
    expect(full).toBeCloseTo(1.5, 10);
    expect(sampled).not.toBeCloseTo(full, 1);
  });
});

describe("inductive learning on a brand-new node", () => {
  it("applies the exact same aggregation function to a node absent from the original graph", () => {
    // node 6: feature 4, one neighbor (node 0, feature 1) -> mean = (4+1)/2 = 2.5
    expect(newNodeAggregate()).toBeCloseTo(2.5, 10);
  });
});
