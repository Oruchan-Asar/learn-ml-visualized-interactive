export interface EmbeddingWord {
  label: string;
  x: number;
  y: number;
}

/**
 * A toy 2D embedding space, hand-placed so that royalty and gender each form a clean axis —
 * real embeddings have hundreds of dimensions and are learned, not placed, but the geometry
 * (distance = meaning, arithmetic = analogy) works exactly the same way.
 */
export const WORDS: EmbeddingWord[] = [
  { label: "king", x: 3, y: 3 },
  { label: "queen", x: 3, y: 1 },
  { label: "prince", x: 2, y: 3 },
  { label: "princess", x: 2, y: 1 },
  { label: "man", x: 0, y: 3 },
  { label: "woman", x: 0, y: 1 },
];

export const DOMAIN: [number, number] = [-1, 4];

export function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** The nearest other word to `word`, by Euclidean distance in the embedding space. */
export function nearestNeighbor(word: EmbeddingWord, words: EmbeddingWord[] = WORDS): EmbeddingWord {
  const others = words.filter((w) => w.label !== word.label);
  return others.reduce((best, w) => (distance(word, w) < distance(word, best) ? w : best));
}

/** The nearest word to an arbitrary point, e.g. the result of analogy arithmetic. */
export function nearestWordToPoint(point: { x: number; y: number }, words: EmbeddingWord[] = WORDS): EmbeddingWord {
  return words.reduce((best, w) => (distance(point, w) < distance(point, best) ? w : best));
}

export function findWord(label: string): EmbeddingWord {
  const w = WORDS.find((word) => word.label === label);
  if (!w) throw new Error(`Unknown word: ${label}`);
  return w;
}

/** a - b + c, the classic analogy arithmetic: king - man + woman ≈ queen. */
export function analogy(a: EmbeddingWord, b: EmbeddingWord, c: EmbeddingWord): { x: number; y: number } {
  return { x: a.x - b.x + c.x, y: a.y - b.y + c.y };
}

export const ANALOGY_A = "king";
export const ANALOGY_B = "man";
export const ANALOGY_C = "woman";
export const ANALOGY_ANSWER = "queen";
