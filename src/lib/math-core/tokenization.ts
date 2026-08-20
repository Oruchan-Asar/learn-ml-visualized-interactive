export const END_OF_WORD = "</w>";

/** The classic toy BPE corpus (word: frequency) — small enough to trace by hand, big enough to show real merges. */
export const CORPUS: Record<string, number> = {
  low: 5,
  lower: 2,
  newest: 6,
  widest: 3,
};

interface WordSymbols {
  symbols: string[];
  freq: number;
}

function initialSymbols(corpus: Record<string, number>): Record<string, WordSymbols> {
  const words: Record<string, WordSymbols> = {};
  for (const [w, f] of Object.entries(corpus)) {
    words[w] = { symbols: [...w.split(""), END_OF_WORD], freq: f };
  }
  return words;
}

function pairCounts(words: Record<string, WordSymbols>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const w of Object.values(words)) {
    for (let i = 0; i < w.symbols.length - 1; i++) {
      const key = `${w.symbols[i]}␟${w.symbols[i + 1]}`;
      counts.set(key, (counts.get(key) ?? 0) + w.freq);
    }
  }
  return counts;
}

function applyMergeToWords(words: Record<string, WordSymbols>, a: string, b: string): void {
  const merged = a + b;
  for (const w of Object.values(words)) {
    const next: string[] = [];
    let i = 0;
    while (i < w.symbols.length) {
      if (i < w.symbols.length - 1 && w.symbols[i] === a && w.symbols[i + 1] === b) {
        next.push(merged);
        i += 2;
      } else {
        next.push(w.symbols[i]);
        i += 1;
      }
    }
    w.symbols = next;
  }
}

export interface MergeStep {
  pair: [string, string];
  merged: string;
  count: number;
}

/** Runs byte-pair encoding on the corpus: repeatedly merge the most frequent adjacent symbol pair. */
export function learnMerges(corpus: Record<string, number>, numMerges: number): MergeStep[] {
  const words = initialSymbols(corpus);
  const merges: MergeStep[] = [];
  for (let step = 0; step < numMerges; step++) {
    const counts = pairCounts(words);
    let bestKey: string | null = null;
    let bestCount = -1;
    for (const [key, count] of counts) {
      if (count > bestCount) {
        bestCount = count;
        bestKey = key;
      }
    }
    if (!bestKey) break;
    const [a, b] = bestKey.split("␟");
    applyMergeToWords(words, a, b);
    merges.push({ pair: [a, b], merged: a + b, count: bestCount });
  }
  return merges;
}

export const NUM_MERGES = 6;
export const MERGES: MergeStep[] = learnMerges(CORPUS, NUM_MERGES);

/** Tokenizes an arbitrary word by applying the learned merges, in order, to its character sequence. */
export function tokenize(word: string, merges: MergeStep[] = MERGES): string[] {
  let symbols = [...word.split(""), END_OF_WORD];
  for (const { pair, merged } of merges) {
    const [a, b] = pair;
    const next: string[] = [];
    let i = 0;
    while (i < symbols.length) {
      if (i < symbols.length - 1 && symbols[i] === a && symbols[i + 1] === b) {
        next.push(merged);
        i += 2;
      } else {
        next.push(symbols[i]);
        i += 1;
      }
    }
    symbols = next;
  }
  return symbols;
}

/** The vocabulary: every distinct token that appears once all merges are applied to the training corpus, plus the base characters, in first-seen order. */
export function buildVocabulary(corpus: Record<string, number> = CORPUS, merges: MergeStep[] = MERGES): string[] {
  const vocab: string[] = [];
  const seen = new Set<string>();
  const add = (tok: string) => {
    if (!seen.has(tok)) {
      seen.add(tok);
      vocab.push(tok);
    }
  };
  for (const word of Object.keys(corpus)) {
    for (const ch of word) add(ch);
  }
  add(END_OF_WORD);
  for (const word of Object.keys(corpus)) {
    for (const tok of tokenize(word, merges)) add(tok);
  }
  return vocab;
}

export const VOCABULARY: string[] = buildVocabulary();

export function tokenId(token: string): number {
  const id = VOCABULARY.indexOf(token);
  if (id === -1) throw new Error(`Token not in vocabulary: ${token}`);
  return id;
}

export function encode(word: string): { tokens: string[]; ids: number[] } {
  const tokens = tokenize(word);
  return { tokens, ids: tokens.map((t) => (VOCABULARY.includes(t) ? tokenId(t) : -1)) };
}

/** Tokenizes using only the first `count` learned merges — for animating the merge process step by step. */
export function tokenizeAtStep(word: string, count: number): string[] {
  return tokenize(word, MERGES.slice(0, count));
}
