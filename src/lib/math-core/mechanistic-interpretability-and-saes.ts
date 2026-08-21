/**
 * A single neuron can fire for two totally unrelated concepts at once — "superposition" lets a network
 * pack more concepts into a layer than it has dimensions, at the cost of no single neuron meaning any
 * one thing on its own. A sparse autoencoder learns to undo that mixing: given the tangled raw
 * activation, recover a sparse, individually-meaningful strength per concept. This chapter uses a known,
 * invertible linear mixing so the "undo" step is exact — real SAEs learn an approximate one from data
 * alone, with no ground-truth mixing matrix to check against.
 */
export interface Concepts {
  animal: number;
  finance: number;
}

/** raw = MIXING_MATRIX · [animal, finance] — a stand-in for however superposition actually entangled these two concepts into 2 raw dimensions. */
export const MIXING_MATRIX: [[number, number], [number, number]] = [
  [3, 0.5],
  [1, 3],
];

export interface Example {
  label: string;
  concepts: Concepts;
}

export const EXAMPLES: Example[] = [
  { label: "cat", concepts: { animal: 1, finance: 0 } },
  { label: "stock", concepts: { animal: 0, finance: 1 } },
  { label: "catfish stock tip", concepts: { animal: 0.4, finance: 0.6 } },
];

/** The forward mixing: clean concept strengths in, tangled raw activation out. */
export function mix(concepts: Concepts): [number, number] {
  const [a, b] = [concepts.animal, concepts.finance];
  return [MIXING_MATRIX[0][0] * a + MIXING_MATRIX[0][1] * b, MIXING_MATRIX[1][0] * a + MIXING_MATRIX[1][1] * b];
}

/** The SAE's job, done exactly via matrix inversion: tangled raw activation in, clean concept strengths back out. */
export function unmix(raw: [number, number]): Concepts {
  const [[m00, m01], [m10, m11]] = MIXING_MATRIX;
  const det = m00 * m11 - m01 * m10;
  return {
    animal: (m11 * raw[0] - m01 * raw[1]) / det,
    finance: (-m10 * raw[0] + m00 * raw[1]) / det,
  };
}

export const CANDIDATES: { label: string; concepts: Concepts }[] = [
  { label: "candidate 1", concepts: { animal: 0.8, finance: 0.2 } },
  { label: "candidate 2", concepts: { animal: 0.2, finance: 0.8 } },
  { label: "candidate 3", concepts: { animal: 0.5, finance: 0.5 } },
];
