import { softmax } from "@/lib/math-core/attention";

/**
 * Six frames of a repeating up-down motion: high, low, high, low, high, low. Exactly the same
 * mechanism as the Vision Transformer chapter — content embedding plus a small position embedding,
 * fed through self-attention — except the "patches" are frames spread across time instead of
 * across space, and "distance" is how many frames apart two moments are, not pixels.
 */
export interface Frame {
  index: number;
  state: 0 | 1;
}

export const FRAMES: Frame[] = [0, 1, 2, 3, 4, 5].map((i) => ({ index: i, state: (i % 2 === 0 ? 1 : 0) as 0 | 1 }));

export function frameEmbedding(frame: Frame): { x: number; y: number } {
  return { x: 2 * frame.state, y: 0.1 * frame.index };
}

/** How many frames apart two moments are — the temporal analogue of Chebyshev distance between patches. */
export function temporalDistance(a: Frame, b: Frame): number {
  return Math.abs(a.index - b.index);
}

/** Whether frame b is within a local window (e.g. what a frame-differencing or small-kernel 1D conv could directly relate to frame a). */
export function inLocalWindow(a: Frame, b: Frame, windowSize: number = 1): boolean {
  return temporalDistance(a, b) <= windowSize;
}

function dot(u: { x: number; y: number }, v: { x: number; y: number }): number {
  return u.x * v.x + u.y * v.y;
}

export function temporalAttentionWeights(queryIndex: number, frames: Frame[] = FRAMES): number[] {
  const embeddings = frames.map(frameEmbedding);
  const q = embeddings[queryIndex];
  const scores = embeddings.map((e) => dot(q, e) / Math.sqrt(2));
  return softmax(scores);
}
