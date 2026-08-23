import { describe, expect, it } from "vitest";
import { POINTS, runAgglomerative, cutDendrogram, clusterCountAtHeight } from "@/lib/math-core/hierarchical-and-agglomerative-clustering";

describe("single-linkage agglomerative clustering on 5 points along one axis (0,1,2,6,7)", () => {
  const steps = runAgglomerative(POINTS);

  it("produces exactly n-1 merges", () => {
    expect(steps.length).toBe(4);
  });

  it("merges A(0) and B(1) first, at height 1 — the closest pair overall", () => {
    expect(steps[0].height).toBe(1);
    expect(steps[0].merged).toEqual([[0], [1]]);
  });

  it("merges C(2) into {A,B} next, at height 1 (single-linkage: C is distance 1 from B)", () => {
    expect(steps[1].height).toBe(1);
    expect(steps[1].clustersAfter).toContainEqual([0, 1, 2]);
  });

  it("merges D(6) and E(7) third, at height 1", () => {
    expect(steps[2].height).toBe(1);
    expect(steps[2].merged).toEqual([[3], [4]]);
  });

  it("joins the two groups last, at height 4 — a much bigger jump than any earlier merge", () => {
    expect(steps[3].height).toBe(4);
    expect(steps[3].clustersAfter).toEqual([[0, 1, 2, 3, 4]]);
  });
});

describe("cutting the dendrogram", () => {
  const steps = runAgglomerative(POINTS);

  it("cutting below height 1 leaves every point in its own cluster", () => {
    expect(clusterCountAtHeight(steps, 0.5)).toBe(5);
  });

  it("cutting between height 1 and 4 recovers the two true groups", () => {
    const clusters = cutDendrogram(steps, 2.5);
    expect(clusters.length).toBe(2);
    expect(clusters).toContainEqual([0, 1, 2]);
    expect(clusters).toContainEqual([3, 4]);
  });

  it("cutting at or above height 4 collapses everything into one cluster", () => {
    expect(clusterCountAtHeight(steps, 4)).toBe(1);
  });
});
