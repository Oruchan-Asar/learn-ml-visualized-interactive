import { describe, it, expect } from "vitest";
import { CLUSTER_POINTS, INITIAL_CENTROIDS, kMeansStep } from "@/lib/math-core/kmeans";

describe("k-means from a deliberately bad start converges in exactly 3 steps", () => {
  it("step 1 splits the data in a way that doesn't yet match the true blobs", () => {
    const { assignments, centroids } = kMeansStep(CLUSTER_POINTS, INITIAL_CENTROIDS);
    expect(assignments).toEqual([1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0]);
    expect(centroids[0].x).toBeCloseTo(46 / 6, 10);
    expect(centroids[0].y).toBeCloseTo(38.5 / 6, 10);
    expect(centroids[1].x).toBeCloseTo(16 / 6, 10);
    expect(centroids[1].y).toBeCloseTo(16.5 / 6, 10);
  });

  it("step 2 corrects to the true blobs and moves the centroids onto their real means", () => {
    const step1 = kMeansStep(CLUSTER_POINTS, INITIAL_CENTROIDS);
    const step2 = kMeansStep(CLUSTER_POINTS, step1.centroids);
    expect(step2.assignments).toEqual([1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0]);
    expect(step2.centroids[0].x).toBeCloseTo(52 / 6, 10);
    expect(step2.centroids[0].y).toBeCloseTo(45.5 / 6, 10);
    expect(step2.centroids[1].x).toBeCloseTo(10 / 6, 10);
    expect(step2.centroids[1].y).toBeCloseTo(9.5 / 6, 10);
  });

  it("step 3 changes nothing — both assignments and centroids are already stable", () => {
    const step1 = kMeansStep(CLUSTER_POINTS, INITIAL_CENTROIDS);
    const step2 = kMeansStep(CLUSTER_POINTS, step1.centroids);
    const step3 = kMeansStep(CLUSTER_POINTS, step2.centroids);
    expect(step3.assignments).toEqual(step2.assignments);
    expect(step3.centroids[0].x).toBeCloseTo(step2.centroids[0].x, 10);
    expect(step3.centroids[0].y).toBeCloseTo(step2.centroids[0].y, 10);
    expect(step3.centroids[1].x).toBeCloseTo(step2.centroids[1].x, 10);
    expect(step3.centroids[1].y).toBeCloseTo(step2.centroids[1].y, 10);
  });
});

describe("updateCentroids leaves an empty cluster's centroid unchanged", () => {
  it("doesn't produce NaN when a centroid gets zero points assigned to it", () => {
    const farAwayCentroids = [
      { x: 1.5, y: 1.5 },
      { x: 100, y: 100 },
    ];
    const { assignments, centroids } = kMeansStep(CLUSTER_POINTS, farAwayCentroids);
    expect(assignments.every((a) => a === 0)).toBe(true);
    expect(centroids[1]).toEqual(farAwayCentroids[1]);
  });
});
