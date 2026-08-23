/**
 * A trained network's neurons don't self-report what they compute — the only way to find out is to poke
 * them: vary one input at a time and watch which neuron moves ("probing"), or borrow one neuron's
 * activation from a different input into an otherwise-unchanged forward pass and see whether the output
 * follows it ("activation patching"). This chapter's network is tiny — two hidden neurons, three binary
 * input features — and its weights are fixed and known, so both moves are exact arithmetic instead of an
 * empirical guess.
 */
export interface Features {
  /** 1 = large, 0 = small. */
  size: number;
  /** 1 = has legs, 0 = no legs. */
  legs: number;
  /** 1 = made of metal, 0 = not. */
  metal: number;
}

function relu(x: number): number {
  return Math.max(0, x);
}

/** Neuron A: fires only for something large AND not metal — indifferent to legs entirely. */
export function neuronA(f: Features): number {
  return relu(2 * f.size - 3 * f.metal - 1);
}

/** Neuron B: fires for anything with legs, regardless of size or material. */
export function neuronB(f: Features): number {
  return relu(3 * f.legs - 1);
}

export const OUTPUT_WEIGHTS = { a: 2, b: -0.5 };

/** The network's single output score, combining both hidden neurons. */
export function output(f: Features): number {
  return OUTPUT_WEIGHTS.a * neuronA(f) + OUTPUT_WEIGHTS.b * neuronB(f);
}

export interface Example {
  label: string;
  features: Features;
}

export const EXAMPLES: Example[] = [
  { label: "mouse", features: { size: 0, legs: 1, metal: 0 } },
  { label: "elephant", features: { size: 1, legs: 1, metal: 0 } },
  { label: "car", features: { size: 1, legs: 0, metal: 1 } },
  { label: "spider", features: { size: 0, legs: 1, metal: 0 } },
];

export type PatchedNeuron = "A" | "B";

/**
 * Activation patching: run the forward pass on `target`'s features, except one hidden neuron's
 * activation is overwritten with the value it took on a different input (`source`). If the output moves
 * toward source's own output, that neuron is (at least partly) causally responsible for the
 * target/source difference — not just correlated with it.
 */
export function patchedOutput(target: Features, source: Features, patch: PatchedNeuron): number {
  const a = patch === "A" ? neuronA(source) : neuronA(target);
  const b = patch === "B" ? neuronB(source) : neuronB(target);
  return OUTPUT_WEIGHTS.a * a + OUTPUT_WEIGHTS.b * b;
}
