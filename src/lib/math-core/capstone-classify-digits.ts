import { KERNEL as HAND_DESIGNED_KERNEL } from "@/lib/math-core/convolution";

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

export { HAND_DESIGNED_KERNEL };

export const IMAGE_SIZE = 6;
export const KERNEL_SIZE = 3;
export const FEATURE_MAP_SIZE = IMAGE_SIZE - KERNEL_SIZE + 1;
export const POOL_SIZE = 2;
export const STRIDE = 2;
export const POOLED_SIZE = (FEATURE_MAP_SIZE - POOL_SIZE) / STRIDE + 1;
export const NUM_FILTERS = 2;
export const FLATTENED_SIZE = NUM_FILTERS * POOLED_SIZE * POOLED_SIZE;
export const NUM_CLASSES = 2;
export const CLASS_LABELS = ["Vertical edge", "Horizontal edge"];

export interface DigitExample {
  image: number[][];
  label: number;
}

/** Same value repeated down every row — the boundary runs left-to-right across columns. */
function columnPattern(pattern: number[]): number[][] {
  return Array.from({ length: IMAGE_SIZE }, () => [...pattern]);
}

/** Same value repeated across every column — the boundary runs top-to-bottom across rows. */
function rowPattern(pattern: number[]): number[][] {
  return pattern.map((v) => Array(IMAGE_SIZE).fill(v));
}

export const TRAINING_SET: DigitExample[] = [
  { image: columnPattern([0, 0, 0, 1, 1, 1]), label: 0 },
  { image: columnPattern([0, 0, 1, 1, 1, 1]), label: 0 },
  { image: rowPattern([0, 0, 0, 1, 1, 1]), label: 1 },
  { image: rowPattern([0, 0, 1, 1, 1, 1]), label: 1 },
];

export interface CnnWeights {
  kernels: number[][][];
  kernelBias: number[];
  denseWeights: number[][];
  denseBias: number[];
}

const SEED = 2024;

/** Fresh random weights, deterministic (seeded) so every run of the app starts from the same point. */
export function initialWeights(): CnnWeights {
  const gen = makeNormalGenerator(SEED);
  return {
    kernels: Array.from({ length: NUM_FILTERS }, () =>
      Array.from({ length: KERNEL_SIZE }, () => Array.from({ length: KERNEL_SIZE }, () => gen() * 0.5)),
    ),
    kernelBias: Array.from({ length: NUM_FILTERS }, () => gen() * 0.1),
    denseWeights: Array.from({ length: NUM_CLASSES }, () =>
      Array.from({ length: FLATTENED_SIZE }, () => gen() * 0.5),
    ),
    denseBias: Array.from({ length: NUM_CLASSES }, () => 0),
  };
}

function convolve(image: number[][], kernel: number[][], bias: number): number[][] {
  const out: number[][] = [];
  for (let r = 0; r < FEATURE_MAP_SIZE; r++) {
    const row: number[] = [];
    for (let c = 0; c < FEATURE_MAP_SIZE; c++) {
      let sum = bias;
      for (let i = 0; i < KERNEL_SIZE; i++) {
        for (let j = 0; j < KERNEL_SIZE; j++) {
          sum += kernel[i][j] * image[r + i][c + j];
        }
      }
      row.push(sum);
    }
    out.push(row);
  }
  return out;
}

function relu(x: number): number {
  return Math.max(0, x);
}

interface PoolResult {
  pooled: number[][];
  argmaxRow: number[][];
  argmaxCol: number[][];
}

function maxPool(map: number[][]): PoolResult {
  const pooled: number[][] = [];
  const argmaxRow: number[][] = [];
  const argmaxCol: number[][] = [];
  for (let r = 0; r < POOLED_SIZE; r++) {
    const prow: number[] = [];
    const arow: number[] = [];
    const acol: number[] = [];
    for (let c = 0; c < POOLED_SIZE; c++) {
      let best = -Infinity;
      let bestI = 0;
      let bestJ = 0;
      for (let i = 0; i < POOL_SIZE; i++) {
        for (let j = 0; j < POOL_SIZE; j++) {
          const v = map[r * STRIDE + i][c * STRIDE + j];
          if (v > best) {
            best = v;
            bestI = i;
            bestJ = j;
          }
        }
      }
      prow.push(best);
      arow.push(bestI);
      acol.push(bestJ);
    }
    pooled.push(prow);
    argmaxRow.push(arow);
    argmaxCol.push(acol);
  }
  return { pooled, argmaxRow, argmaxCol };
}

function softmax(logits: number[]): number[] {
  const max = Math.max(...logits);
  const exps = logits.map((z) => Math.exp(z - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export interface ForwardCache {
  featureMaps: number[][][];
  reluMaps: number[][][];
  poolResults: PoolResult[];
  flattened: number[];
  logits: number[];
  probs: number[];
}

export function forward(weights: CnnWeights, image: number[][]): ForwardCache {
  const featureMaps = weights.kernels.map((k, f) => convolve(image, k, weights.kernelBias[f]));
  const reluMaps = featureMaps.map((m) => m.map((row) => row.map(relu)));
  const poolResults = reluMaps.map((m) => maxPool(m));
  const flattened = poolResults.flatMap((p) => p.pooled.flat());
  const logits = weights.denseWeights.map(
    (w, i) => w.reduce((s, wi, k) => s + wi * flattened[k], 0) + weights.denseBias[i],
  );
  const probs = softmax(logits);
  return { featureMaps, reluMaps, poolResults, flattened, logits, probs };
}

interface Gradients {
  dKernels: number[][][];
  dKernelBias: number[];
  dDenseWeights: number[][];
  dDenseBias: number[];
}

function backward(weights: CnnWeights, image: number[][], label: number, cache: ForwardCache): Gradients {
  const dLogits = cache.probs.map((p, i) => p - (i === label ? 1 : 0));

  const dDenseWeights = weights.denseWeights.map((row, i) => row.map((_, k) => dLogits[i] * cache.flattened[k]));
  const dDenseBias = dLogits.slice();

  const dFlattened = new Array(FLATTENED_SIZE).fill(0);
  for (let k = 0; k < FLATTENED_SIZE; k++) {
    let s = 0;
    for (let i = 0; i < NUM_CLASSES; i++) s += weights.denseWeights[i][k] * dLogits[i];
    dFlattened[k] = s;
  }

  const dPooled: number[][][] = [];
  let idx = 0;
  for (let f = 0; f < NUM_FILTERS; f++) {
    const grid: number[][] = [];
    for (let r = 0; r < POOLED_SIZE; r++) {
      const row: number[] = [];
      for (let c = 0; c < POOLED_SIZE; c++) {
        row.push(dFlattened[idx]);
        idx++;
      }
      grid.push(row);
    }
    dPooled.push(grid);
  }

  const dKernels = weights.kernels.map((k) => k.map((row) => row.map(() => 0)));
  const dKernelBias = weights.kernels.map(() => 0);

  for (let f = 0; f < NUM_FILTERS; f++) {
    const dReluMap = Array.from({ length: FEATURE_MAP_SIZE }, () => Array(FEATURE_MAP_SIZE).fill(0));
    const pr = cache.poolResults[f];
    for (let r = 0; r < POOLED_SIZE; r++) {
      for (let c = 0; c < POOLED_SIZE; c++) {
        const di = pr.argmaxRow[r][c];
        const dj = pr.argmaxCol[r][c];
        dReluMap[r * STRIDE + di][c * STRIDE + dj] += dPooled[f][r][c];
      }
    }
    const dFeatureMap = dReluMap.map((row, r) => row.map((v, c) => (cache.featureMaps[f][r][c] > 0 ? v : 0)));

    for (let i = 0; i < KERNEL_SIZE; i++) {
      for (let j = 0; j < KERNEL_SIZE; j++) {
        let s = 0;
        for (let r = 0; r < FEATURE_MAP_SIZE; r++) {
          for (let c = 0; c < FEATURE_MAP_SIZE; c++) {
            s += dFeatureMap[r][c] * image[r + i][c + j];
          }
        }
        dKernels[f][i][j] = s;
      }
    }

    let biasSum = 0;
    for (let r = 0; r < FEATURE_MAP_SIZE; r++) {
      for (let c = 0; c < FEATURE_MAP_SIZE; c++) biasSum += dFeatureMap[r][c];
    }
    dKernelBias[f] = biasSum;
  }

  return { dKernels, dKernelBias, dDenseWeights, dDenseBias };
}

export function meanLoss(weights: CnnWeights): number {
  let total = 0;
  for (const ex of TRAINING_SET) {
    const { probs } = forward(weights, ex.image);
    total += -Math.log(probs[ex.label]);
  }
  return total / TRAINING_SET.length;
}

export const LEARNING_RATE = 0.5;
export const EPOCHS_PER_STEP = 5;
export const TARGET_LOSS = 0.01;
export const MAX_STEPS = 20;

/** One full-batch gradient descent step over the whole training set, via backprop through every layer. */
export function trainStep(weights: CnnWeights, learningRate = LEARNING_RATE): CnnWeights {
  const gKernels = weights.kernels.map((k) => k.map((row) => row.map(() => 0)));
  const gKernelBias = weights.kernels.map(() => 0);
  const gDenseWeights = weights.denseWeights.map((row) => row.map(() => 0));
  const gDenseBias = weights.denseBias.map(() => 0);

  for (const ex of TRAINING_SET) {
    const cache = forward(weights, ex.image);
    const grad = backward(weights, ex.image, ex.label, cache);
    for (let f = 0; f < NUM_FILTERS; f++) {
      for (let i = 0; i < KERNEL_SIZE; i++) {
        for (let j = 0; j < KERNEL_SIZE; j++) gKernels[f][i][j] += grad.dKernels[f][i][j];
      }
      gKernelBias[f] += grad.dKernelBias[f];
    }
    for (let i = 0; i < NUM_CLASSES; i++) {
      for (let k = 0; k < FLATTENED_SIZE; k++) gDenseWeights[i][k] += grad.dDenseWeights[i][k];
      gDenseBias[i] += grad.dDenseBias[i];
    }
  }

  const n = TRAINING_SET.length;
  return {
    kernels: weights.kernels.map((k, f) =>
      k.map((row, i) => row.map((w, j) => w - (learningRate * gKernels[f][i][j]) / n)),
    ),
    kernelBias: weights.kernelBias.map((b, f) => b - (learningRate * gKernelBias[f]) / n),
    denseWeights: weights.denseWeights.map((row, i) =>
      row.map((w, k) => w - (learningRate * gDenseWeights[i][k]) / n),
    ),
    denseBias: weights.denseBias.map((b, i) => b - (learningRate * gDenseBias[i]) / n),
  };
}

export function trainEpochs(weights: CnnWeights, epochs: number): CnnWeights {
  let current = weights;
  for (let i = 0; i < epochs; i++) current = trainStep(current);
  return current;
}

export function argmax(values: number[]): number {
  let best = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[best]) best = i;
  }
  return best;
}

export function predict(weights: CnnWeights, image: number[][]): number {
  return argmax(forward(weights, image).logits);
}
