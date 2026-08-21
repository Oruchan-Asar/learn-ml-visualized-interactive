export type Modality = "image" | "text" | "audio";

export interface EmbeddedItem {
  label: string;
  x: number;
  y: number;
  modality: Modality;
}

/**
 * The same joint embedding space from the joint-embedding-spaces chapter, now with a third
 * modality added: a spoken recording of each word, placed near its own image/caption cluster —
 * a real speech encoder is trained to do exactly this, mapping audio into the same space text
 * and images already share.
 */
export const ITEMS: EmbeddedItem[] = [
  { label: "Image: dog", x: 2, y: 3, modality: "image" },
  { label: "Image: cat", x: 0, y: 1, modality: "image" },
  { label: "Image: bird", x: 4, y: 0, modality: "image" },
  { label: "Caption: a dog running", x: 2.2, y: 2.8, modality: "text" },
  { label: "Caption: a cat sleeping", x: 0.3, y: 0.8, modality: "text" },
  { label: "Caption: a bird flying", x: 3.7, y: 0.4, modality: "text" },
  { label: "Audio: a dog barking", x: 1.9, y: 3.2, modality: "audio" },
  { label: "Audio: a cat meowing", x: 0.1, y: 1.2, modality: "audio" },
  { label: "Audio: a bird chirping", x: 4.2, y: 0.2, modality: "audio" },
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

/** Every item of a given modality, ranked nearest-first to the query — retrieval across any pair of the three modalities. */
export function rankByModality(item: EmbeddedItem, targetModality: Modality, items: EmbeddedItem[] = ITEMS): { item: EmbeddedItem; d: number }[] {
  return items
    .filter((i) => i.modality === targetModality)
    .map((i) => ({ item: i, d: distance(item, i) }))
    .sort((a, b) => a.d - b.d);
}

export function nearestOfModality(item: EmbeddedItem, targetModality: Modality, items: EmbeddedItem[] = ITEMS): EmbeddedItem {
  return rankByModality(item, targetModality, items)[0].item;
}
