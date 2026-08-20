import { transferTrace, fromScratchTrace, mse } from "./transfer-learning-and-fine-tuning";

export { transferTrace, fromScratchTrace, mse };

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * The frozen "pretrained backbone": the exact residual-block recursion from the ResNet chapter
 * (h_i = h_{i-1} + weight*sigmoid(weight*h_{i-1})), fixed weight, run for a fixed depth. Two new
 * task inputs pass through this SAME frozen backbone to produce two features — the only thing
 * that gets fine-tuned afterward is a small linear head on top of those features.
 */
export const BACKBONE_WEIGHT = 3;
export const BACKBONE_DEPTH = 1;

export function backboneFeature(x0: number, depth: number = BACKBONE_DEPTH, weight: number = BACKBONE_WEIGHT): number {
  let h = x0;
  for (let i = 0; i < depth; i++) {
    h = h + weight * sigmoid(weight * h);
  }
  return h;
}

export const NEW_TASK_INPUTS: number[] = [-1, 1];
/** The head's true relationship — the exact same y=2x+5 shape the transfer-learning chapter fine-tuned, but now x is a backbone feature instead of a raw input. */
export const HEAD_TRUE_W = 2;
export const HEAD_TRUE_B = 5;

export interface TargetPoint {
  x: number;
  y: number;
}

export function targetPoints(inputs: number[] = NEW_TASK_INPUTS): TargetPoint[] {
  return inputs.map((x0) => {
    const feature = backboneFeature(x0);
    return { x: feature, y: HEAD_TRUE_W * feature + HEAD_TRUE_B };
  });
}
