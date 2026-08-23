import { softmax } from "@/lib/math-core/attention";

/**
 * A Diffusion Transformer (DiT) replaces a diffusion model's convolutional U-Net with a plain transformer.
 * The recipe is the ViT recipe: cut the (noisy) image into fixed-size patches, flatten them into a token
 * sequence, and run the exact same self-attention block a text transformer would use. The one genuinely new
 * ingredient is how the model learns *which noise level* it's looking at: instead of a U-Net's per-resolution
 * encoder path, DiT folds the timestep into every patch via a simplified "adaptive layer norm" (adaLN) --
 * a per-timestep scale (gamma) and shift (beta) applied to each patch's content, identically across all
 * patches, before attention ever runs. One backbone, every noise level.
 */

/** A 2x2 grid of image patches, flattened into a length-4 sequence -- exactly how DiT feeds patches into a
 * transformer, the same way a sentence's words are fed in. */
export const GRID_SIZE = 2;
export const NUM_PATCHES = GRID_SIZE * GRID_SIZE;

export interface Patch {
  label: string;
  row: number;
  col: number;
  /** The (noisy) scalar pixel value this toy patch carries, before any timestep conditioning. */
  content: number;
}

export const PATCHES: Patch[] = [
  { label: "p0", row: 0, col: 0, content: 3 },
  { label: "p1", row: 0, col: 1, content: 1 },
  { label: "p2", row: 1, col: 0, content: 0 },
  { label: "p3", row: 1, col: 1, content: 2 },
];

export function positionIndex(patch: Patch): number {
  return patch.row * GRID_SIZE + patch.col;
}

/** Total diffusion timesteps, matching this Part's other diffusion chapters. */
export const T = 4;
/** How strongly the timestep dilates each patch's value. */
export const GAMMA_WEIGHT = 0.5;
/** How strongly the timestep shifts each patch's value. */
export const BETA_WEIGHT = -1;

/** The timestep, normalized to c in [0, 1] -- the only input to the conditioning below. */
export function timestepCondition(t: number): number {
  return t / T;
}

/** Simplified adaLN: a per-timestep scale (gamma) and shift (beta), applied identically to every patch.
 * At t=0 (c=0), gamma=1 and beta=0 -- an ordinary, unconditioned ViT block. */
export function adaLN(content: number, t: number): number {
  const c = timestepCondition(t);
  const gamma = 1 + GAMMA_WEIGHT * c;
  const beta = BETA_WEIGHT * c;
  return gamma * content + beta;
}

/** Modulate a patch's content by the timestep, then add a small position term -- identical machinery to
 * ViT's patch-plus-position embedding, just fed a conditioned value instead of the raw pixel. */
export function patchEmbedding(patch: Patch, t: number): { x: number; y: number } {
  return { x: adaLN(patch.content, t), y: 0.1 * positionIndex(patch) };
}

function dot(u: { x: number; y: number }, v: { x: number; y: number }): number {
  return u.x * v.x + u.y * v.y;
}

/** Attention weights from one query patch to every patch, at a given timestep -- the same scaled
 * dot-product softmax as any other transformer block. */
export function ditAttentionWeights(queryIndex: number, t: number, patches: Patch[] = PATCHES): number[] {
  const embeddings = patches.map((p) => patchEmbedding(p, t));
  const q = embeddings[queryIndex];
  const scores = embeddings.map((e) => dot(q, e) / Math.sqrt(2));
  return softmax(scores);
}

/** The full attention matrix at timestep t: row i holds patch i's attention weights over every patch. */
export function ditAttentionMatrix(t: number, patches: Patch[] = PATCHES): number[][] {
  return patches.map((_, i) => ditAttentionWeights(i, t, patches));
}

/** The self-attention output for a query patch: every patch's (conditioned) value, mixed by attention --
 * what DiT actually passes on to its MLP after this block. */
export function attentionOutput(queryIndex: number, t: number, patches: Patch[] = PATCHES): number {
  const weights = ditAttentionWeights(queryIndex, t, patches);
  const embeddings = patches.map((p) => patchEmbedding(p, t));
  return weights.reduce((sum, w, i) => sum + w * embeddings[i].x, 0);
}

/** How much of p0's own attention it pays to itself -- rises as the timestep conditioning stretches p0's
 * already-largest content further from the rest, the checkpoint's target quantity. */
export function selfAttentionWeight(t: number): number {
  return ditAttentionWeights(0, t)[0];
}

export const TARGET_SELF_WEIGHT = 0.95;
export const DEFAULT_T = 2;
