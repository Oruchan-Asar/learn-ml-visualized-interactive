function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller transform for an approximately standard-normal generator, seeded deterministically. */
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

export const FAN_IN = 8;
export const NUM_LAYERS = 6;
export const IDEAL_SCALE = 1 / Math.sqrt(FAN_IN);
export const SCALE_DOMAIN: [number, number] = [0.02, 1];

const normalGen = makeNormalGenerator(42);

/** Fixed random-normal weight matrices, one per layer — precomputed once so every run of the app sees the same network. */
const WEIGHTS: number[][][] = Array.from({ length: NUM_LAYERS }, () =>
  Array.from({ length: FAN_IN }, () => Array.from({ length: FAN_IN }, () => normalGen())),
);

/** A fixed input vector, generated the same way. */
const INPUT: number[] = Array.from({ length: FAN_IN }, () => normalGen());

function rms(v: number[]): number {
  return Math.sqrt(v.reduce((sum, a) => sum + a * a, 0) / v.length);
}

/** Propagates INPUT through NUM_LAYERS linear layers, each weight scaled by `scale`, returning the RMS activation at every layer (including layer 0, the input). */
export function rmsPerLayer(scale: number): number[] {
  let h = INPUT;
  const rmsValues = [rms(h)];
  for (let l = 0; l < NUM_LAYERS; l++) {
    const w = WEIGHTS[l];
    const next: number[] = [];
    for (let i = 0; i < FAN_IN; i++) {
      let sum = 0;
      for (let j = 0; j < FAN_IN; j++) sum += w[i][j] * scale * h[j];
      next.push(sum);
    }
    h = next;
    rmsValues.push(rms(h));
  }
  return rmsValues;
}

export const HEALTHY_RANGE: [number, number] = [0.3, 3];
