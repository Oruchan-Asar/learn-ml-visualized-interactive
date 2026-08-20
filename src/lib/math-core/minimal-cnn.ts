export const IMAGE_SIZE = 6;
export const KERNEL_SIZE = 3;
export const FEATURE_MAP_SIZE = IMAGE_SIZE - KERNEL_SIZE + 1;
export const POOL_SIZE = 2;
export const STRIDE = 2;
export const POOLED_SIZE = (FEATURE_MAP_SIZE - POOL_SIZE) / STRIDE + 1;

/** One column pattern, repeated down every row: light, dark, light — two edges, one each direction. */
export const IMAGE_PATTERN = [1, 1, 0, 0, 1, 1];
export const IMAGE: number[][] = Array.from({ length: IMAGE_SIZE }, () => [...IMAGE_PATTERN]);

/** The same vertical dark-to-light edge detector from Chapter 1. */
export const KERNEL: number[][] = [
  [-1, 0, 1],
  [-1, 0, 1],
  [-1, 0, 1],
];

export const CLASS_LABELS = ["Edge detected", "No edge"];
export const TRUE_CLASS_INDEX = 0;

/** Two neurons reading the flattened 4-value pooled map: one votes for the feature, one against. */
export const DENSE_WEIGHTS: number[][] = [
  [1, 1, 1, 1],
  [-1, -1, -1, -1],
];
export const DENSE_BIAS = [-2, 2];

function convolveAt(row: number, col: number): number {
  let sum = 0;
  for (let kr = 0; kr < KERNEL_SIZE; kr++) {
    for (let kc = 0; kc < KERNEL_SIZE; kc++) {
      sum += KERNEL[kr][kc] * IMAGE[row + kr][col + kc];
    }
  }
  return sum;
}

export function computeFeatureMap(): number[][] {
  return Array.from({ length: FEATURE_MAP_SIZE }, (_, r) =>
    Array.from({ length: FEATURE_MAP_SIZE }, (_, c) => convolveAt(r, c)),
  );
}

export const FEATURE_MAP: number[][] = computeFeatureMap();

export function relu(x: number): number {
  return Math.max(0, x);
}

export function computeReluMap(map: number[][]): number[][] {
  return map.map((row) => row.map(relu));
}

export const RELU_MAP: number[][] = computeReluMap(FEATURE_MAP);

function poolWindowValues(map: number[][], outRow: number, outCol: number): number[] {
  const vals: number[] = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    for (let j = 0; j < POOL_SIZE; j++) {
      vals.push(map[outRow * STRIDE + i][outCol * STRIDE + j]);
    }
  }
  return vals;
}

export function computePooled(map: number[][]): number[][] {
  return Array.from({ length: POOLED_SIZE }, (_, r) =>
    Array.from({ length: POOLED_SIZE }, (_, c) => Math.max(...poolWindowValues(map, r, c))),
  );
}

export const POOLED_RELU: number[][] = computePooled(RELU_MAP);
export const POOLED_RAW: number[][] = computePooled(FEATURE_MAP);

export function flatten(map: number[][]): number[] {
  return map.flat();
}

export const FLATTENED_RELU: number[] = flatten(POOLED_RELU);
export const FLATTENED_RAW: number[] = flatten(POOLED_RAW);

export function computeLogits(flattened: number[]): number[] {
  return DENSE_WEIGHTS.map(
    (weights, i) => weights.reduce((sum, w, j) => sum + w * flattened[j], 0) + DENSE_BIAS[i],
  );
}

export function argmax(values: number[]): number {
  let best = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[best]) best = i;
  }
  return best;
}

export interface Pipeline {
  featureMap: number[][];
  activeMap: number[][];
  pooled: number[][];
  flattened: number[];
  logits: number[];
  predictedIndex: number;
}

/** Runs the full image -> conv -> (ReLU) -> pool -> flatten -> dense pipeline. */
export function computePipeline(reluEnabled: boolean): Pipeline {
  const activeMap = reluEnabled ? RELU_MAP : FEATURE_MAP;
  const pooled = reluEnabled ? POOLED_RELU : POOLED_RAW;
  const flattened = reluEnabled ? FLATTENED_RELU : FLATTENED_RAW;
  const logits = computeLogits(flattened);
  return { featureMap: FEATURE_MAP, activeMap, pooled, flattened, logits, predictedIndex: argmax(logits) };
}
