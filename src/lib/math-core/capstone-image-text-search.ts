import { ITEMS, DOMAIN, distance, findItem, type EmbeddedItem } from "./joint-embedding-spaces";

export { ITEMS, DOMAIN, findItem };
export type { EmbeddedItem };

/** The three typeable search queries — Chapter 1's exact captions, reused as "what a user typed." */
export const SEARCH_QUERIES: string[] = ITEMS.filter((i) => i.modality === "text").map((i) => i.label);

export interface SearchResult {
  label: string;
  d: number;
}

/** The full search: rank every image by distance to the typed query's embedding — the entire "engine." */
export function search(queryLabel: string): SearchResult[] {
  const query = findItem(queryLabel);
  const images = ITEMS.filter((i) => i.modality === "image");
  return images.map((img) => ({ label: img.label, d: distance(query, img) })).sort((a, b) => a.d - b.d);
}

export function topMatch(queryLabel: string): SearchResult {
  return search(queryLabel)[0];
}

/** How much clearer the winner is than the runner-up — a simple confidence signal for the ranking. */
export function margin(queryLabel: string): number {
  const results = search(queryLabel);
  return results[1].d - results[0].d;
}
