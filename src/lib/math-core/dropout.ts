function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNormalGenerator(seed: number): () => number {
  const rng = mulberry32(seed);
  return function () {
    let u = 0;
    let v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
}

export const NUM_NEURONS = 8;

const normalGen = makeNormalGenerator(99);
/** Fixed activations and output weights for one layer — generated once, deterministic. */
export const ACTIVATIONS: number[] = Array.from({ length: NUM_NEURONS }, () => normalGen());
export const OUTPUT_WEIGHTS: number[] = Array.from({ length: NUM_NEURONS }, () => normalGen());

/** The plain, undropped output — every neuron contributes exactly once. */
export const TRUE_OUTPUT: number = ACTIVATIONS.reduce((sum, h, i) => sum + OUTPUT_WEIGHTS[i] * h, 0);

export interface DropoutSample {
  mask: boolean[];
  output: number;
  activeCount: number;
}

/**
 * Draws one dropout mask (each neuron kept independently with probability 1-p) and computes the
 * "inverted dropout" output: survivors scaled by 1/(1-p) so the *expected* output stays TRUE_OUTPUT
 * for any p, even though any single draw is noisy.
 */
export function sampleDropout(p: number, rng: () => number): DropoutSample {
  const mask = ACTIVATIONS.map(() => rng() > p);
  const activeCount = mask.filter(Boolean).length;
  let sum = 0;
  for (let i = 0; i < NUM_NEURONS; i++) {
    if (mask[i]) sum += OUTPUT_WEIGHTS[i] * ACTIVATIONS[i];
  }
  const output = p < 1 ? sum / (1 - p) : 0;
  return { mask, output, activeCount };
}

/** Same as sampleDropout, but keyed purely by a sample index — deterministic and safe to call during SSR/hydration. */
export function sampleAtIndex(p: number, index: number): DropoutSample {
  return sampleDropout(p, mulberry32(1000 + index * 7919));
}

/** The expected number of neurons still active at dropout rate p. */
export function expectedActiveCount(p: number): number {
  return NUM_NEURONS * (1 - p);
}

export const RATE_DOMAIN: [number, number] = [0, 0.8];
export const TARGET_ACTIVE_COUNT = 3;
export const TARGET_TOLERANCE = 0.2;
