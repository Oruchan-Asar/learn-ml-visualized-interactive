import { describe, expect, it } from "vitest";
import {
  MANIFOLD_POINTS,
  INIT_LAYOUT,
  LEARNING_RATE,
  kNearestIndices,
  fuzzyGraph,
  runLayout,
  distance2D,
} from "@/lib/math-core/umap-manifold-approximation";

describe("k-nearest-neighbor graph on the L-shaped 5-point manifold", () => {
  it("gives A its true path neighbors, B and C", () => {
    expect(kNearestIndices(0, MANIFOLD_POINTS, 2)).toEqual([1, 2]);
  });

  it("gives C its true path neighbors, B and D — not A or E, despite C sitting at the bend", () => {
    expect(kNearestIndices(2, MANIFOLD_POINTS, 2)).toEqual([1, 3]);
  });
});

describe("fuzzy membership weights, hand-computed with rho=1, sigma=1", () => {
  const v = fuzzyGraph(MANIFOLD_POINTS);

  it("gives every direct path edge full strength 1", () => {
    expect(v[0][1]).toBeCloseTo(1, 6); // A-B
    expect(v[1][2]).toBeCloseTo(1, 6); // B-C
    expect(v[2][3]).toBeCloseTo(1, 6); // C-D
    expect(v[3][4]).toBeCloseTo(1, 6); // D-E
  });

  it("gives the two 'skip' pairs (A-C, C-E) weight exp(-1), a genuine but weaker connection", () => {
    expect(v[0][2]).toBeCloseTo(Math.exp(-1), 6);
    expect(v[2][4]).toBeCloseTo(Math.exp(-1), 6);
  });

  it("gives never-neighboring pairs (A-D, A-E, B-D, B-E) weight exactly 0", () => {
    expect(v[0][3]).toBe(0);
    expect(v[0][4]).toBe(0);
    expect(v[1][3]).toBe(0);
    expect(v[1][4]).toBe(0);
  });

  it("is symmetric", () => {
    for (let i = 0; i < v.length; i++) for (let j = 0; j < v.length; j++) expect(v[i][j]).toBeCloseTo(v[j][i], 10);
  });
});

describe("force layout pulls connected points together and pushes disconnected ones apart", () => {
  const weights = fuzzyGraph(MANIFOLD_POINTS);
  const laidOut = runLayout(INIT_LAYOUT, weights, 200, LEARNING_RATE);

  it("ends up with A much closer to its strong neighbor B than to the unconnected D", () => {
    expect(distance2D(laidOut[0], laidOut[1])).toBeLessThan(distance2D(laidOut[0], laidOut[3]));
  });

  it("ends up with D much closer to its strong neighbor E than to the unconnected A", () => {
    expect(distance2D(laidOut[3], laidOut[4])).toBeLessThan(distance2D(laidOut[3], laidOut[0]));
  });
});
