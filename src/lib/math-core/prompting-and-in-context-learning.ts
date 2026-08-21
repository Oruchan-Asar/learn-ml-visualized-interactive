/**
 * A frozen "model" that never updates a single weight: given a few (input, output) demonstration
 * pairs in its context and a new query input, it attends over the demonstrations by similarity to
 * the query and outputs a weighted blend of their outputs — exactly the attention mechanism from
 * Part IV, repurposed as a kernel-regression view of in-context learning. Changing which
 * demonstrations appear in the prompt is the only thing that ever changes the answer.
 */
export interface Demonstration {
  x: number;
  y: number;
}

export const DOUBLE_DEMOS: Demonstration[] = [
  { x: 1, y: 2 },
  { x: 2, y: 4 },
  { x: 3, y: 6 },
];

export const NEGATE_DEMOS: Demonstration[] = [
  { x: 1, y: -1 },
  { x: 2, y: -2 },
  { x: 3, y: -3 },
];

export const KERNEL_BANDWIDTH = 1;

function kernelWeight(query: number, x: number, bandwidth: number = KERNEL_BANDWIDTH): number {
  return Math.exp(-((query - x) ** 2) / (2 * bandwidth ** 2));
}

export interface InContextResult {
  weights: number[];
  answer: number;
}

/** The in-context "forward pass": attention-weighted average of the demonstrated outputs, nothing trained. */
export function inContextAnswer(demos: Demonstration[], query: number, bandwidth: number = KERNEL_BANDWIDTH): InContextResult {
  const rawWeights = demos.map((d) => kernelWeight(query, d.x, bandwidth));
  const sum = rawWeights.reduce((a, b) => a + b, 0);
  const weights = rawWeights.map((w) => w / sum);
  const answer = demos.reduce((acc, d, i) => acc + weights[i] * d.y, 0);
  return { weights, answer };
}

export const QUERY_X = 2.5;
