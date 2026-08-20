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

export const FAN_IN = 8;
export const NUM_LAYERS = 6;
export const BATCH_SIZE = 16;
export const IDEAL_SCALE = 1 / Math.sqrt(FAN_IN);
export const SCALE_DOMAIN: [number, number] = [0.02, 1];
export const BN_EPS = 1e-5;

const normalGen = makeNormalGenerator(7);

const WEIGHTS: number[][][] = Array.from({ length: NUM_LAYERS }, () =>
  Array.from({ length: FAN_IN }, () => Array.from({ length: FAN_IN }, () => normalGen())),
);

const INPUT_BATCH: number[][] = Array.from({ length: BATCH_SIZE }, () =>
  Array.from({ length: FAN_IN }, () => normalGen()),
);

function rmsOfBatch(batch: number[][]): number {
  let sumSq = 0;
  let count = 0;
  for (const v of batch) {
    for (const x of v) {
      sumSq += x * x;
      count++;
    }
  }
  return Math.sqrt(sumSq / count);
}

function linearLayer(batch: number[][], w: number[][], scale: number): number[][] {
  return batch.map((h) => {
    const next: number[] = [];
    for (let i = 0; i < FAN_IN; i++) {
      let sum = 0;
      for (let j = 0; j < FAN_IN; j++) sum += w[i][j] * scale * h[j];
      next.push(sum);
    }
    return next;
  });
}

/** Normalizes each neuron (column) to zero mean, unit variance across the batch. */
function batchNormalize(batch: number[][]): number[][] {
  const means = new Array(FAN_IN).fill(0);
  for (const v of batch) for (let j = 0; j < FAN_IN; j++) means[j] += v[j];
  for (let j = 0; j < FAN_IN; j++) means[j] /= batch.length;

  const variances = new Array(FAN_IN).fill(0);
  for (const v of batch) for (let j = 0; j < FAN_IN; j++) variances[j] += (v[j] - means[j]) ** 2;
  for (let j = 0; j < FAN_IN; j++) variances[j] /= batch.length;

  return batch.map((v) => v.map((x, j) => (x - means[j]) / Math.sqrt(variances[j] + BN_EPS)));
}

/** RMS activation at every layer (including the input), with or without inserting batch norm after each layer. */
export function rmsPerLayer(scale: number, useBatchNorm: boolean): number[] {
  let batch = INPUT_BATCH;
  const values = [rmsOfBatch(batch)];
  for (let l = 0; l < NUM_LAYERS; l++) {
    batch = linearLayer(batch, WEIGHTS[l], scale);
    if (useBatchNorm) batch = batchNormalize(batch);
    values.push(rmsOfBatch(batch));
  }
  return values;
}

export const BAD_LOW = 0.1;
export const BAD_HIGH = 10;
export const GOOD_LOW = 0.7;
export const GOOD_HIGH = 1.3;
