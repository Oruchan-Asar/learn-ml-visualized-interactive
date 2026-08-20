import {
  IMAGE,
  IMAGE_SIZE,
  KERNEL,
  KERNEL_SIZE,
  FEATURE_MAP_SIZE,
  CLASS_LABELS,
  TRUE_CLASS_INDEX,
  computeReluMap,
  computePooled,
  flatten,
  computeLogits,
  argmax,
} from "./minimal-cnn";

export { IMAGE, IMAGE_SIZE, CLASS_LABELS, TRUE_CLASS_INDEX };

/** Same conv -> ReLU -> pool -> dense pipeline as the minimal CNN, but parameterized over the image
 * so a single pixel can be perturbed without disturbing the rest — exactly what a numerical gradient needs. */
function convolveAt(image: number[][], row: number, col: number): number {
  let sum = 0;
  for (let kr = 0; kr < KERNEL_SIZE; kr++) {
    for (let kc = 0; kc < KERNEL_SIZE; kc++) {
      sum += KERNEL[kr][kc] * image[row + kr][col + kc];
    }
  }
  return sum;
}

function computeFeatureMapFor(image: number[][]): number[][] {
  return Array.from({ length: FEATURE_MAP_SIZE }, (_, r) =>
    Array.from({ length: FEATURE_MAP_SIZE }, (_, c) => convolveAt(image, r, c)),
  );
}

export function logitsForImage(image: number[][]): number[] {
  const featureMap = computeFeatureMapFor(image);
  const reluMap = computeReluMap(featureMap);
  const pooled = computePooled(reluMap);
  return computeLogits(flatten(pooled));
}

export const BASE_LOGITS: number[] = logitsForImage(IMAGE);
export const BASE_PREDICTED_INDEX: number = argmax(BASE_LOGITS);

/** The image with one pixel nudged by delta, everything else untouched. */
function perturb(image: number[][], row: number, col: number, delta: number): number[][] {
  return image.map((r, ri) => r.map((v, ci) => (ri === row && ci === col ? v + delta : v)));
}

export const EPSILON = 0.01;

/** Central-difference numerical gradient of one class's logit w.r.t. one pixel — the pixel's raw saliency. */
export function saliencyAt(row: number, col: number, classIndex: number = BASE_PREDICTED_INDEX): number {
  const plus = logitsForImage(perturb(IMAGE, row, col, EPSILON))[classIndex];
  const minus = logitsForImage(perturb(IMAGE, row, col, -EPSILON))[classIndex];
  return Math.abs((plus - minus) / (2 * EPSILON));
}

export function computeSaliencyMap(classIndex: number = BASE_PREDICTED_INDEX): number[][] {
  return Array.from({ length: IMAGE_SIZE }, (_, r) =>
    Array.from({ length: IMAGE_SIZE }, (_, c) => saliencyAt(r, c, classIndex)),
  );
}

export function maxSaliencyLocation(map: number[][]): { row: number; col: number; value: number } {
  let best = { row: 0, col: 0, value: -Infinity };
  for (let r = 0; r < map.length; r++) {
    for (let c = 0; c < map[r].length; c++) {
      if (map[r][c] > best.value) best = { row: r, col: c, value: map[r][c] };
    }
  }
  return best;
}
