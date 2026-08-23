import type { Vec2 } from "./vectors";
import { dot, magnitude } from "./vectors";

/** L1 (Manhattan) norm: sum of absolute components. */
export function l1Norm(v: Vec2): number {
  return Math.abs(v.x) + Math.abs(v.y);
}

/** L2 (Euclidean) norm: straight-line length. */
export function l2Norm(v: Vec2): number {
  return magnitude(v);
}

/** L-infinity norm: the largest single component, in absolute value. */
export function lInfNorm(v: Vec2): number {
  return Math.max(Math.abs(v.x), Math.abs(v.y));
}

/** Cosine similarity: the dot product normalized by both magnitudes, in [-1, 1]. */
export function cosineSimilarity(a: Vec2, b: Vec2): number {
  return dot(a, b) / (magnitude(a) * magnitude(b));
}

/** Cosine distance: 1 minus cosine similarity, so identical directions give 0. */
export function cosineDistance(a: Vec2, b: Vec2): number {
  return 1 - cosineSimilarity(a, b);
}
