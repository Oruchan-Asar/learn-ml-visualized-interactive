import { describe, expect, it } from "vitest";
import {
  POINTS,
  RANDOM_DRAWS,
  kmeansPlusPlusInit,
  inertiaForK,
  elbowCurve,
  findElbowK,
  nearestSquaredDistances,
} from "@/lib/math-core/kmeans-plus-plus-and-elbow-method";

describe("k-means++ seeding spreads centroids across the true blobs", () => {
  it("picks one centroid per blob for k=3, by hand-computed D(x)^2 weighting", () => {
    // c1 fixed at point 0 = (0,0). D(x)^2 sums to 731 over the other 8 points; the cumulative
    // distribution crosses draw=0.5 (threshold 365.5) inside C1's slot, at (5, 10).
    const seed = kmeansPlusPlusInit(POINTS, 3);
    expect(seed).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 10 },
      { x: 11, y: 0 },
    ]);
  });

  it("computes D(x)^2 relative to the nearest chosen centroid only", () => {
    const d = nearestSquaredDistances(POINTS, [{ x: 0, y: 0 }]);
    expect(d[0]).toBe(0); // the centroid itself
    expect(d[1]).toBe(1); // (1,0)
    expect(d[6]).toBe(125); // (5,10): 25 + 100
  });
});

describe("elbow curve on three well-separated blobs", () => {
  const curve = elbowCurve(POINTS, [1, 2, 3, 4]);

  it("matches the hand-derived inertia values exactly", () => {
    expect(curve[0]).toBeCloseTo(354, 6); // k=1: one centroid at the grand mean
    expect(curve[1]).toBeCloseTo(154, 6); // k=2: A+B lumped together, C alone
    expect(curve[2]).toBeCloseTo(4, 6); // k=3: one centroid per blob, each blob's own inertia is 4/3
    expect(curve[3]).toBeCloseTo(19 / 6, 6); // k=4: a blob gets needlessly split, barely helping
  });

  it("finds the elbow at k=3 — the last k with a large marginal improvement", () => {
    expect(findElbowK(curve, [1, 2, 3, 4])).toBe(3);
  });

  it("is deterministic across repeated calls with the fixed random draws", () => {
    expect(inertiaForK(POINTS, 3, RANDOM_DRAWS)).toBeCloseTo(inertiaForK(POINTS, 3, RANDOM_DRAWS), 10);
  });
});
