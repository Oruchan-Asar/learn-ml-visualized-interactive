export type Modality = "image" | "text";

export interface EmbeddedItem {
  label: string;
  x: number;
  y: number;
  modality: Modality;
}

/**
 * A toy joint embedding space: three images and three captions, hand-placed so each image sits
 * nearest to its own true caption and far from the other two — real CLIP-style spaces have hundreds
 * of dimensions and are learned, not placed, but the geometry works exactly the same way.
 */
export const ITEMS: EmbeddedItem[] = [
  { label: "Image: dog", x: 2, y: 3, modality: "image" },
  { label: "Image: cat", x: 0, y: 1, modality: "image" },
  { label: "Image: bird", x: 4, y: 0, modality: "image" },
  { label: "Caption: a dog running", x: 2.2, y: 2.8, modality: "text" },
  { label: "Caption: a cat sleeping", x: 0.3, y: 0.8, modality: "text" },
  { label: "Caption: a bird flying", x: 3.7, y: 0.4, modality: "text" },
];

export const DOMAIN: [number, number] = [-1, 5];

export function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function findItem(label: string): EmbeddedItem {
  const item = ITEMS.find((i) => i.label === label);
  if (!item) throw new Error(`Unknown item: ${label}`);
  return item;
}

/** The nearest item of the OTHER modality — cross-modal retrieval is the entire point of a joint space. */
export function nearestOfOtherModality(item: EmbeddedItem, items: EmbeddedItem[] = ITEMS): EmbeddedItem {
  const candidates = items.filter((i) => i.modality !== item.modality);
  return candidates.reduce((best, i) => (distance(item, i) < distance(item, best) ? i : best));
}

/** Every candidate of the other modality, ranked nearest-first — a small "search result" ranking. */
export function rankOtherModality(item: EmbeddedItem, items: EmbeddedItem[] = ITEMS): { item: EmbeddedItem; d: number }[] {
  return items
    .filter((i) => i.modality !== item.modality)
    .map((i) => ({ item: i, d: distance(item, i) }))
    .sort((a, b) => a.d - b.d);
}
