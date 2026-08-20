export const INPUT_SIZE = 4;
export const POOL_SIZE = 2;
export const STRIDE = 2;
export const OUTPUT_SIZE = (INPUT_SIZE - POOL_SIZE) / STRIDE + 1;

/**
 * A feature map with two isolated detections: a strong one (6) in the top-left
 * window and a weaker one (4) in the bottom-right window, each surrounded by zeros.
 */
export const FEATURE_MAP: number[][] = [
  [2, 2, 0, 0],
  [2, 6, 0, 0],
  [0, 0, 4, 0],
  [0, 0, 0, 0],
];

function windowValues(map: number[][], outRow: number, outCol: number): number[] {
  const vals: number[] = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    for (let j = 0; j < POOL_SIZE; j++) {
      vals.push(map[outRow * STRIDE + i][outCol * STRIDE + j]);
    }
  }
  return vals;
}

export function maxPoolAt(outRow: number, outCol: number): number {
  return Math.max(...windowValues(FEATURE_MAP, outRow, outCol));
}

export function avgPoolAt(outRow: number, outCol: number): number {
  const vals = windowValues(FEATURE_MAP, outRow, outCol);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function computeMaxPooled(): number[][] {
  return Array.from({ length: OUTPUT_SIZE }, (_, r) =>
    Array.from({ length: OUTPUT_SIZE }, (_, c) => maxPoolAt(r, c)),
  );
}

export function computeAvgPooled(): number[][] {
  return Array.from({ length: OUTPUT_SIZE }, (_, r) =>
    Array.from({ length: OUTPUT_SIZE }, (_, c) => avgPoolAt(r, c)),
  );
}

export const MAX_POOLED: number[][] = computeMaxPooled();
export const AVG_POOLED: number[][] = computeAvgPooled();
