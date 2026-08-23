import { describe, expect, it } from "vitest";
import {
  CUSTOMER_FEATURES,
  CUSTOMER_LABELS,
  RATINGS,
  MISSING,
  embedCustomers,
  segmentCustomers,
  predictMissingRating,
  distance2D,
} from "@/lib/math-core/capstone-customer-segmentation-engine";
import { train as trainFactors, predict as predictRating } from "@/lib/math-core/collaborative-filtering-and-matrix-factorization";

describe("stage 1 — UMAP-style embedding collapses each true group to one spot", () => {
  const embedding = embedCustomers();

  it("puts every high-spender (C1-C3) at (essentially) the same 2D point", () => {
    expect(distance2D(embedding[0], embedding[1])).toBeCloseTo(0, 4);
    expect(distance2D(embedding[0], embedding[2])).toBeCloseTo(0, 4);
  });

  it("puts every occasional shopper (C4-C6) at (essentially) the same 2D point", () => {
    expect(distance2D(embedding[3], embedding[4])).toBeCloseTo(0, 4);
    expect(distance2D(embedding[3], embedding[5])).toBeCloseTo(0, 4);
  });

  it("separates the two groups by a wide margin — far larger than any within-group distance", () => {
    expect(distance2D(embedding[0], embedding[3])).toBeGreaterThan(20);
  });
});

describe("stage 2 — k-means++ segmentation recovers the two true groups from geometry alone", () => {
  const embedding = embedCustomers();
  const { assignments, centroids } = segmentCustomers(embedding, 2);

  it("assigns C1-C3 to one segment and C4-C6 to the other", () => {
    expect(assignments[0]).toBe(assignments[1]);
    expect(assignments[1]).toBe(assignments[2]);
    expect(assignments[3]).toBe(assignments[4]);
    expect(assignments[4]).toBe(assignments[5]);
    expect(assignments[0]).not.toBe(assignments[3]);
  });

  it("lands each centroid essentially on top of its group's collapsed embedding point", () => {
    const highSpenderCentroid = centroids[assignments[0]];
    expect(distance2D(highSpenderCentroid, embedding[0])).toBeCloseTo(0, 4);
  });
});

describe("stage 3 — matrix factorization predicts the one missing rating (C2's rating of Y)", () => {
  it("matches training the shared collaborative-filtering module directly on the same data", () => {
    const factors = trainFactors(RATINGS, 2, 2000);
    const direct = predictRating(factors, MISSING.user, MISSING.item);
    expect(predictMissingRating(2, 2000)).toBeCloseTo(direct, 6);
  });

  it("predicts a specific, stable value with k=2 that both taste groups' extreme scores would predict", () => {
    const pred = predictMissingRating(2, 2000);
    expect(pred).toBeCloseTo(3.59, 1);
    expect(pred).toBeGreaterThan(1);
    expect(pred).toBeLessThan(5);
  });

  it("is essentially unchanged by training much longer, confirming convergence", () => {
    expect(predictMissingRating(2, 5000)).toBeCloseTo(predictMissingRating(2, 2000), 2);
  });

  it("k=1 gives a meaningfully different (lower-capacity) prediction than k=2", () => {
    expect(predictMissingRating(1, 2000)).toBeLessThan(predictMissingRating(2, 2000) - 0.5);
  });
});

describe("pipeline shape sanity", () => {
  it("has 6 customers, each with a label", () => {
    expect(CUSTOMER_FEATURES.length).toBe(6);
    expect(CUSTOMER_LABELS.length).toBe(6);
  });

  it("has exactly one missing rating, at C2's row", () => {
    const missingCount = RATINGS.flat().filter((r) => r === null).length;
    expect(missingCount).toBe(1);
    expect(MISSING.user).toBe(1);
  });
});
