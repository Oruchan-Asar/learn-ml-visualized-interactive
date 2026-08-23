/** A tiny 2x3 joint probability table over A (rows) and B (columns) — clean fractional entries that sum to 1. */
export const A_LABELS = ["a1", "a2"] as const;
export const B_LABELS = ["b1", "b2", "b3"] as const;

/** JOINT[i][j] = P(A = A_LABELS[i], B = B_LABELS[j]). */
export const JOINT: number[][] = [
  [0.2, 0.1, 0.2],
  [0.1, 0.3, 0.1],
];

/** P(A = a_i) — sum out (marginalize over) every column in row i. */
export function marginalA(joint: number[][]): number[] {
  return joint.map((row) => row.reduce((s, v) => s + v, 0));
}

/** P(B = b_j) — sum out (marginalize over) every row in column j. */
export function marginalB(joint: number[][]): number[] {
  const cols = joint[0].length;
  return Array.from({ length: cols }, (_, j) => joint.reduce((s, row) => s + row[j], 0));
}

/** P(B | A = a_i) — row i renormalized by its own row sum. */
export function conditionalBGivenA(joint: number[][], aIndex: number): number[] {
  const rowSum = marginalA(joint)[aIndex];
  return joint[aIndex].map((v) => v / rowSum);
}

/** P(A | B = b_j) — column j renormalized by its own column sum. */
export function conditionalAGivenB(joint: number[][], bIndex: number): number[] {
  const colSum = marginalB(joint)[bIndex];
  return joint.map((row) => row[bIndex] / colSum);
}

export function totalMass(joint: number[][]): number {
  return joint.reduce((s, row) => s + row.reduce((r, v) => r + v, 0), 0);
}
