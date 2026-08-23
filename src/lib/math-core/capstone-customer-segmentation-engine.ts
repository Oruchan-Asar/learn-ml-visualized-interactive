import { euclideanDistance, fuzzyGraph, runLayout, type Point2D, type Vector } from "./umap-manifold-approximation";
import { kmeansPlusPlusInit, lloydConverge } from "./kmeans-plus-plus-and-elbow-method";
import { train, predict, type RatingsMatrix } from "./collaborative-filtering-and-matrix-factorization";

/**
 * Six customers described by three raw behavioral features — [monthly spend, visits per month,
 * days since last purchase] — forming two clearly opposite groups: frequent high-spenders who
 * shopped recently (C1-C3), and occasional low-spenders who haven't been back in a while (C4-C6).
 * This is the same "two opposite groups" shape used throughout this part's other chapters, one
 * level up: now it's the *input* to a pipeline, not the answer already labeled for us.
 */
export const CUSTOMER_FEATURES: Vector[] = [
  [9, 8, 1], // C1
  [8, 9, 2], // C2
  [9, 9, 1], // C3
  [1, 1, 9], // C4
  [2, 1, 8], // C5
  [1, 2, 9], // C6
];

export const CUSTOMER_LABELS = ["C1", "C2", "C3", "C4", "C5", "C6"];
export const K_NEIGHBORS = 2;

/** Fixed starting layout for the 6 customers — see umap-manifold-approximation for why it's fixed
 * rather than random. */
export const INIT_LAYOUT: Point2D[] = [
  { x: 0.1, y: 0.06 },
  { x: -0.05, y: 0.09 },
  { x: 0.07, y: -0.07 },
  { x: -0.09, y: -0.04 },
  { x: 0.04, y: 0.08 },
  { x: -0.06, y: -0.09 },
];

export const LAYOUT_STEPS = 200;
export const LAYOUT_LEARNING_RATE = 0.3;

/** Stage 1 — reuses this part's UMAP mechanic unchanged: build a fuzzy neighbor graph over the raw
 * 3D features, then lay it out in 2D by attracting along edges and repelling everywhere else. */
export function embedCustomers(): Point2D[] {
  const weights = fuzzyGraph(CUSTOMER_FEATURES, K_NEIGHBORS);
  return runLayout(INIT_LAYOUT, weights, LAYOUT_STEPS, LAYOUT_LEARNING_RATE);
}

export const SEGMENT_DRAWS = [0.5];

/** Stage 2 — reuses this part's k-means++ mechanic unchanged: seed 2 centroids over the 2D embedding
 * (spread out via the D(x)^2 rule instead of picked at random) and run Lloyd's algorithm to
 * convergence, recovering the two customer segments from geometry alone. */
export function segmentCustomers(embedding: Point2D[], k: number = 2): { assignments: number[]; centroids: Point2D[] } {
  const seed = kmeansPlusPlusInit(embedding, k, SEGMENT_DRAWS);
  return lloydConverge(embedding, seed);
}

/**
 * Ratings for 3 products (X, Y, Z). The high-value segment (C1-C3) loves X and Y, dislikes Z; the
 * low-value segment (C4-C6) is the mirror image — the same rank-2 taste structure this part's
 * collaborative-filtering chapter relies on. C2's rating of Y was never collected.
 */
export const RATINGS: RatingsMatrix = [
  [5, 4, 1],
  [4, null, 1], // Y deliberately missing
  [5, 4, 1],
  [1, 1, 5],
  [1, 1, 5],
  [1, 1, 4],
];

export const MISSING = { user: 1, item: 1 };

/** Stage 3 — reuses this part's matrix-factorization mechanic unchanged: fit latent factors on the
 * observed ratings, then predict the one entry that's missing. */
export function predictMissingRating(k: number = 2, steps: number = 2000): number {
  const factors = train(RATINGS, k, steps);
  return predict(factors, MISSING.user, MISSING.item);
}

export function distance2D(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export { euclideanDistance };
