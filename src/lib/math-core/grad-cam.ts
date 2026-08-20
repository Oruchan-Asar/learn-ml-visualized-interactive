import { RELU_MAP, CLASS_LABELS, TRUE_CLASS_INDEX, computePooled, flatten, computeLogits } from "./minimal-cnn";

export { RELU_MAP, CLASS_LABELS, TRUE_CLASS_INDEX };

export const EPSILON = 0.01;

function logitsFromReluMap(reluMap: number[][]): number[] {
  const pooled = computePooled(reluMap);
  return computeLogits(flatten(pooled));
}

function perturbCell(map: number[][], row: number, col: number, delta: number): number[][] {
  return map.map((r, ri) => r.map((v, ci) => (ri === row && ci === col ? v + delta : v)));
}

/** Signed gradient of one class's logit w.r.t. one feature-map cell — kept signed, unlike saliency's |.|,
 * because Grad-CAM's channel weight needs to know which direction evidence points before averaging. */
export function gradAt(row: number, col: number, classIndex: number = TRUE_CLASS_INDEX): number {
  const plus = logitsFromReluMap(perturbCell(RELU_MAP, row, col, EPSILON))[classIndex];
  const minus = logitsFromReluMap(perturbCell(RELU_MAP, row, col, -EPSILON))[classIndex];
  return (plus - minus) / (2 * EPSILON);
}

export function computeGradMap(classIndex: number = TRUE_CLASS_INDEX): number[][] {
  return RELU_MAP.map((row, r) => row.map((_, c) => gradAt(r, c, classIndex)));
}

/** The channel weight: global-average-pool the gradient map over every spatial location. With one channel,
 * this single scalar is the entire "how much does this channel matter to this class" weight. */
export function channelWeight(classIndex: number = TRUE_CLASS_INDEX): number {
  const gradMap = computeGradMap(classIndex);
  const flat = flatten(gradMap);
  return flat.reduce((sum, v) => sum + v, 0) / flat.length;
}

/** ReLU(weight * activation map) — Grad-CAM keeps only the evidence that positively supports the class. */
export function computeGradCAM(classIndex: number = TRUE_CLASS_INDEX): number[][] {
  const weight = channelWeight(classIndex);
  return RELU_MAP.map((row) => row.map((v) => Math.max(0, weight * v)));
}
