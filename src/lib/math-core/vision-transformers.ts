import { softmax } from "@/lib/math-core/attention";

/**
 * A 3x3 grid of image patches — a bright diagonal (top-left, center, bottom-right) against a dark
 * background. Each patch gets a content embedding (bright/dark) plus a small additive position
 * embedding, exactly like ViT feeds a sequence of patch-plus-position vectors into the same
 * self-attention block a sentence would use.
 */
export const GRID_SIZE = 3;

export interface Patch {
  label: string;
  row: number;
  col: number;
  brightness: 0 | 1;
}

export const PATCHES: Patch[] = [
  { label: "top-left", row: 0, col: 0, brightness: 1 },
  { label: "top-middle", row: 0, col: 1, brightness: 0 },
  { label: "top-right", row: 0, col: 2, brightness: 0 },
  { label: "mid-left", row: 1, col: 0, brightness: 0 },
  { label: "center", row: 1, col: 1, brightness: 1 },
  { label: "mid-right", row: 1, col: 2, brightness: 0 },
  { label: "bottom-left", row: 2, col: 0, brightness: 0 },
  { label: "bottom-middle", row: 2, col: 1, brightness: 0 },
  { label: "bottom-right", row: 2, col: 2, brightness: 1 },
];

export function positionIndex(patch: Patch): number {
  return patch.row * GRID_SIZE + patch.col;
}

/** Content embedding (brightness, scaled) plus a small additive position embedding. */
export function patchEmbedding(patch: Patch): { x: number; y: number } {
  return { x: 2 * patch.brightness, y: 0.1 * positionIndex(patch) };
}

/** Chebyshev distance — the standard notion of "how many conv layers of receptive field apart" two patches are. */
export function chebyshevDistance(a: Patch, b: Patch): number {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col));
}

/** Whether patch b sits within a single 3x3 convolution kernel centered on patch a. */
export function inSingleConvReceptiveField(a: Patch, b: Patch): boolean {
  return chebyshevDistance(a, b) <= 1;
}

function dot(u: { x: number; y: number }, v: { x: number; y: number }): number {
  return u.x * v.x + u.y * v.y;
}

export function patchAttentionWeights(queryIndex: number, patches: Patch[] = PATCHES): number[] {
  const embeddings = patches.map(patchEmbedding);
  const q = embeddings[queryIndex];
  const scores = embeddings.map((e) => dot(q, e) / Math.sqrt(2));
  return softmax(scores);
}
