/**
 * An induction head's whole trick: "the last time I saw this exact token, what came right after it? Do
 * that again." This chapter represents tokens as one-hot vectors so both halves of the mechanism — a
 * previous-token head reporting "the token right before position i was X," and an induction head
 * matching the current token against every one of those reports — reduce to exact dot products instead
 * of a trained, noisy approximation.
 */
export type Token = "A" | "B" | "C";

const VOCAB: Token[] = ["A", "B", "C"];

/** One-hot embedding of a token in the 3-symbol vocabulary. */
export function embed(token: Token): number[] {
  return VOCAB.map((t) => (t === token ? 1 : 0));
}

function dot(a: number[], b: number[]): number {
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}

export interface InductionResult {
  /** Attention weight on each earlier position, same order as `positions`. */
  weights: number[];
  /** The sequence positions (1..length-1) a weight was computed for. */
  positions: number[];
  /** The token the head predicts should come next. */
  predicted: Token;
  /** The single largest attention weight — how confident the match was. */
  maxWeight: number;
}

/**
 * Runs the two-stage induction mechanism on `sequence`, predicting the token that should follow it.
 *
 * Stage 1 (previous-token head): for every position i >= 1, its report is embed(sequence[i-1]).
 * Stage 2 (induction head): score position i by how well that report matches the CURRENT (last) token;
 * normalize the scores into attention weights, falling back to a uniform split if nothing matches at
 * all. The prediction is the token actually sitting AT the position with the highest weight — that's
 * what followed the matching earlier occurrence.
 */
export function runInduction(sequence: Token[]): InductionResult {
  const last = sequence[sequence.length - 1];
  const query = embed(last);
  const positions = sequence.slice(1).map((_, idx) => idx + 1); // 1 .. length-1
  const scores = positions.map((i) => dot(query, embed(sequence[i - 1])));
  const total = scores.reduce((s, v) => s + v, 0);
  const weights = total > 0 ? scores.map((s) => s / total) : scores.map(() => 1 / scores.length);
  const maxWeight = Math.max(...weights);
  const bestIdx = weights.indexOf(maxWeight);
  const predicted = sequence[positions[bestIdx]];
  return { weights, positions, predicted, maxWeight };
}

export interface Example {
  label: string;
  sequence: Token[];
}

export const EXAMPLES: Example[] = [
  { label: "A B C A B", sequence: ["A", "B", "C", "A", "B"] },
  { label: "B C B", sequence: ["B", "C", "B"] },
  { label: "A B C", sequence: ["A", "B", "C"] },
  { label: "C A B C A", sequence: ["C", "A", "B", "C", "A"] },
];
