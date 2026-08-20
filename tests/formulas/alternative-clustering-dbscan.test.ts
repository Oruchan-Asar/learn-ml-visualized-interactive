import { describe, expect, it } from "vitest";
import { runDBSCAN, isCore, neighborIndices, distance, DATA, NOISE } from "@/lib/math-core/alternative-clustering-dbscan";

describe("core points and neighborhoods", () => {
  it("every point in the two chains has at least one neighbor within eps", () => {
    for (let i = 0; i < 7; i++) expect(isCore(i)).toBe(true);
  });

  it("the far-off point has zero neighbors and is not a core point", () => {
    expect(neighborIndices(7)).toEqual([]);
    expect(isCore(7)).toBe(false);
  });

  it("the two chains are exactly 5 units apart — far beyond eps=1.5", () => {
    expect(distance(DATA[3], DATA[4])).toBeCloseTo(Math.hypot(3, 5), 6);
  });
});

describe("DBSCAN finds the two density-connected chains and one noise point", () => {
  const labels = runDBSCAN();

  it("the first chain (4 points) is entirely one cluster", () => {
    expect(labels.slice(0, 4)).toEqual([0, 0, 0, 0]);
  });

  it("the second chain (3 points) is a separate cluster", () => {
    expect(labels.slice(4, 7)).toEqual([1, 1, 1]);
  });

  it("the far-off point is labeled noise, not folded into either cluster", () => {
    expect(labels[7]).toBe(NOISE);
  });

  it("finds exactly 2 clusters total", () => {
    const clusterIds = new Set(labels.filter((l) => l !== NOISE));
    expect(clusterIds.size).toBe(2);
  });
});
