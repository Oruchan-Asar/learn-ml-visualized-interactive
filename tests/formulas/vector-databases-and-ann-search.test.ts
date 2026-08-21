import { describe, expect, it } from "vitest";
import {
  POINTS,
  TOTAL_POINTS,
  cluster,
  bruteForceNearest,
  annNearest,
  QUERY_HIT,
  QUERY_MISS,
  QUERY_CHECKPOINT,
  CHECKPOINT_CANDIDATES,
} from "@/lib/math-core/vector-databases-and-ann-search";

describe("vector-databases-and-ann-search", () => {
  it("every point is assigned to its nearest centroid, splitting the index into two clusters of 4", () => {
    expect(TOTAL_POINTS).toBe(8);
    expect(cluster("A").map((p) => p.label)).toEqual(["a1", "a2", "a3", "a4"]);
    expect(cluster("B").map((p) => p.label)).toEqual(["b1", "b2", "b3", "b4"]);
  });

  it("QUERY_HIT: approximate search finds the exact same answer as brute force", () => {
    const brute = bruteForceNearest(QUERY_HIT);
    const ann = annNearest(QUERY_HIT);
    expect(brute).toEqual({ label: "a4", distance: 1 });
    expect(ann.label).toBe(brute.label);
    expect(ann.distance).toBe(brute.distance);
    expect(ann.assigned).toBe("A");
    expect(ann.comparisons).toBe(6);
  });

  it("QUERY_MISS: approximate search misses the true nearest neighbor near the cluster boundary", () => {
    const brute = bruteForceNearest(QUERY_MISS);
    const ann = annNearest(QUERY_MISS);
    expect(brute).toEqual({ label: "b4", distance: 5 });
    expect(ann).toMatchObject({ label: "a4", distance: 8, assigned: "A", comparisons: 6 });
    expect(ann.label).not.toBe(brute.label);
  });

  it("brute force always compares against every point in the index", () => {
    const brute = bruteForceNearest(QUERY_MISS);
    expect(POINTS.length).toBe(8);
    expect(brute.label).toBe("b4");
  });

  it("QUERY_CHECKPOINT: a fresh boundary query where the approximate search also misses", () => {
    const brute = bruteForceNearest(QUERY_CHECKPOINT);
    const ann = annNearest(QUERY_CHECKPOINT);
    expect(brute).toEqual({ label: "b4", distance: 5 });
    expect(ann).toMatchObject({ label: "a4", distance: 10, assigned: "A" });
    expect(CHECKPOINT_CANDIDATES).toContain(brute.label);
  });
});
