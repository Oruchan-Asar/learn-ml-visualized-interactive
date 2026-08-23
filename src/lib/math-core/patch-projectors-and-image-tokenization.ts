/**
 * A tiny 4x4 pixel "image," sliced into four non-overlapping 2x2 patches, each flattened into a length-4
 * vector and linearly projected into a 2D embedding — the same operation a ViT/CLIP patch embedding layer
 * performs, just at a scale small enough to compute by hand. Text tokens live in that identical 2D space,
 * so a patch and a word become directly comparable the moment the projection is applied.
 */

export const IMAGE: number[][] = [
  [1, 2, 5, 6],
  [3, 4, 7, 8],
  [9, 10, 13, 14],
  [11, 12, 15, 16],
];

export const PATCH_SIZE = 2;
export const PATCH_GRID = 2; // a 2x2 grid of patches

export interface Patch {
  index: number;
  row: number; // patch-grid row (0 or 1)
  col: number; // patch-grid col (0 or 1)
  pixels: number[][]; // the 2x2 block of raw pixel values
  flat: number[]; // pixels flattened row-major, length 4
}

/** Slices the image into non-overlapping size x size patches, in row-major patch order. */
export function patchify(image: number[][] = IMAGE, size: number = PATCH_SIZE): Patch[] {
  const grid = image.length / size;
  const patches: Patch[] = [];
  for (let pr = 0; pr < grid; pr++) {
    for (let pc = 0; pc < grid; pc++) {
      const pixels: number[][] = [];
      for (let i = 0; i < size; i++) {
        const row: number[] = [];
        for (let j = 0; j < size; j++) {
          row.push(image[pr * size + i][pc * size + j]);
        }
        pixels.push(row);
      }
      patches.push({ index: pr * grid + pc, row: pr, col: pc, pixels, flat: pixels.flat() });
    }
  }
  return patches;
}

export const PATCHES: Patch[] = patchify();
export const PATCH_LABELS = ["top-left", "top-right", "bottom-left", "bottom-right"];

/** Maps a raw pixel cell (row, col) in the full image to the index of the patch that contains it. */
export function patchIndexOfCell(row: number, col: number, size: number = PATCH_SIZE, grid: number = PATCH_GRID): number {
  const pr = Math.floor(row / size);
  const pc = Math.floor(col / size);
  return pr * grid + pc;
}

export const EMBED_DIM = 2;

/**
 * The linear projector: a fixed 2x4 weight matrix, no bias. Row 0 sums a patch's top-row pixels, row 1
 * sums its bottom-row pixels — a deliberately simple (but genuine) linear map from 4 raw pixels down to a
 * 2D embedding, exactly the shape of a real patch-embedding layer (just with hand-pickable weights).
 */
export const PROJECTION: number[][] = [
  [1, 1, 0, 0],
  [0, 0, 1, 1],
];

/** Applies the linear projector to one flattened patch: embedding = W @ flat. */
export function projectPatch(flat: number[], W: number[][] = PROJECTION): number[] {
  return W.map((row) => row.reduce((sum, w, i) => sum + w * flat[i], 0));
}

export function patchEmbedding(index: number, patches: Patch[] = PATCHES): number[] {
  return projectPatch(patches[index].flat);
}

export interface TextToken {
  label: string;
  vec: number[];
}

/**
 * Four text-token embeddings, hand-placed in the *same* 2D coordinate system the patch projector outputs
 * into — each one deliberately equal to one patch's own projected embedding, so "patches and text share a
 * space" is checkable by exact distance, not just asserted.
 */
export const TEXT_TOKENS: TextToken[] = [
  { label: "sky", vec: [3, 7] },
  { label: "grass", vec: [11, 15] },
  { label: "cat", vec: [19, 23] },
  { label: "dog", vec: [27, 31] },
];

export function distance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0));
}

/** The text token whose embedding is nearest to a given patch embedding, by ordinary Euclidean distance. */
export function nearestTextToken(embedding: number[], tokens: TextToken[] = TEXT_TOKENS): { token: TextToken; d: number } {
  const ranked = tokens.map((t) => ({ token: t, d: distance(embedding, t.vec) })).sort((a, b) => a.d - b.d);
  return ranked[0];
}
