import { softmax } from "./attention";

export interface Vec2 {
  x: number;
  y: number;
}

export interface ImagePatch extends Vec2 {
  label: string;
}

/** Three fixed image-patch embeddings — the keys and values a text query will attend over. */
export const PATCHES: ImagePatch[] = [
  { label: "sky patch", x: 2, y: 0 },
  { label: "ground patch", x: 0, y: 2 },
  { label: "dog patch", x: 1, y: 1 },
];

export const DIM = 2;
export const DOMAIN: [number, number] = [-3, 3];
export const DEFAULT_QUERY: Vec2 = { x: 1, y: 2 };

function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

/** Scaled dot-product attention, exactly Part IV's formula — the only difference is where Q vs. K, V came from. */
export function attentionScores(query: Vec2, patches: ImagePatch[] = PATCHES): number[] {
  return patches.map((p) => dot(query, p) / Math.sqrt(DIM));
}

export function attentionWeights(query: Vec2, patches: ImagePatch[] = PATCHES): number[] {
  return softmax(attentionScores(query, patches));
}

/** The weighted blend of image patches — a context vector conditioned on the text query. */
export function attentionContext(query: Vec2, patches: ImagePatch[] = PATCHES): Vec2 {
  const weights = attentionWeights(query, patches);
  return patches.reduce(
    (acc, p, i) => ({ x: acc.x + weights[i] * p.x, y: acc.y + weights[i] * p.y }),
    { x: 0, y: 0 },
  );
}
