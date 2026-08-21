import { describe, it, expect } from "vitest";
import { NODES, EDGES, FEATURES, adjacencyMatrix, neighbors, degree, allDegrees } from "@/lib/math-core/graphs-as-data";

describe("the fixed graph's structure", () => {
  it("has 6 nodes and 6 edges", () => {
    expect(NODES.length).toBe(6);
    expect(EDGES.length).toBe(6);
  });

  it("has the expected feature vector", () => {
    expect(FEATURES).toEqual([1, 2, 0, 3, 1, 2]);
  });
});

describe("neighbors and degree", () => {
  it("node 0 is only connected to 1 and 2", () => {
    expect(neighbors("0").sort()).toEqual(["1", "2"]);
    expect(degree("0")).toBe(2);
  });

  it("node 1 is a hub connected to 0, 2, and 3", () => {
    expect(neighbors("1").sort()).toEqual(["0", "2", "3"]);
    expect(degree("1")).toBe(3);
  });

  it("node 3 is a hub connected to 1, 4, and 5", () => {
    expect(neighbors("3").sort()).toEqual(["1", "4", "5"]);
    expect(degree("3")).toBe(3);
  });

  it("nodes 4 and 5 are leaves with exactly one neighbor each", () => {
    expect(neighbors("4")).toEqual(["3"]);
    expect(degree("4")).toBe(1);
    expect(neighbors("5")).toEqual(["3"]);
    expect(degree("5")).toBe(1);
  });

  it("degrees are genuinely non-uniform across the graph, unlike a pixel grid", () => {
    const degrees = allDegrees();
    const unique = new Set(Object.values(degrees));
    expect(unique.size).toBeGreaterThan(1);
    expect(degrees).toEqual({ "0": 2, "1": 3, "2": 2, "3": 3, "4": 1, "5": 1 });
  });
});

describe("the adjacency matrix", () => {
  it("is symmetric with a zero diagonal", () => {
    const a = adjacencyMatrix();
    for (let i = 0; i < a.length; i++) {
      expect(a[i][i]).toBe(0);
      for (let j = 0; j < a.length; j++) expect(a[i][j]).toBe(a[j][i]);
    }
  });

  it("row sums equal each node's degree", () => {
    const a = adjacencyMatrix();
    const rowSums = a.map((row) => row.reduce((s, v) => s + v, 0));
    expect(rowSums).toEqual([2, 3, 2, 3, 1, 1]);
  });

  it("matches the edge list exactly — e.g. nodes 0 and 3 are NOT directly connected", () => {
    const a = adjacencyMatrix();
    const index = Object.fromEntries(NODES.map((n, i) => [n.id, i]));
    expect(a[index["0"]][index["3"]]).toBe(0);
    expect(a[index["1"]][index["3"]]).toBe(1);
  });
});
