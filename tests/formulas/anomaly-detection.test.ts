import { describe, expect, it } from "vitest";
import { isolate, isolationDepths, anomalyScore, DATA } from "@/lib/math-core/anomaly-detection";

describe("the deterministic isolation tree", () => {
  it("isolates exactly 6 points, one per leaf", () => {
    expect(isolate(DATA).length).toBe(DATA.length);
  });

  it("the outlier (20) isolates in a single split", () => {
    expect(isolationDepths()[20]).toBe(1);
  });

  it("the clustered points take 3 or 4 splits to isolate", () => {
    const depths = isolationDepths();
    expect(depths[1]).toBe(3);
    expect(depths[2]).toBe(3);
    expect(depths[3]).toBe(3);
    expect(depths[4]).toBe(4);
    expect(depths[5]).toBe(4);
  });
});

describe("anomaly score is highest for the shortest isolation path", () => {
  it("the outlier scores strictly higher than every ordinary point", () => {
    const outlierScore = anomalyScore(20);
    for (const v of [1, 2, 3, 4, 5]) {
      expect(outlierScore).toBeGreaterThan(anomalyScore(v));
    }
  });

  it("the outlier's exact score is 0.8", () => {
    expect(anomalyScore(20)).toBeCloseTo(0.8, 10);
  });
});
