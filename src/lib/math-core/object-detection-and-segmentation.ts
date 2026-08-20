/**
 * A ground-truth bounding box and a predicted one, both on a small pixel grid. The same two boxes
 * answer two questions: "is this detection close enough?" (IoU, geometric) and "how good is the
 * pixel-level mask?" (precision/recall/Dice, reusing the confusion-matrix idea from Part IX —
 * every pixel is either correctly inside, correctly outside, or wrong one way or the other).
 */
export interface Box {
  rowStart: number;
  rowEnd: number;
  colStart: number;
  colEnd: number;
}

export const GRID_ROWS = 5;
export const GRID_COLS = 6;
export const GROUND_TRUTH_BOX: Box = { rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 3 };

export function predictedBox(offset: number): Box {
  return { rowStart: 1, rowEnd: 2, colStart: 1 + offset, colEnd: 3 + offset };
}

export function boxArea(box: Box): number {
  return (box.rowEnd - box.rowStart + 1) * (box.colEnd - box.colStart + 1);
}

export function boxIntersectionArea(a: Box, b: Box): number {
  const rowOverlap = Math.max(0, Math.min(a.rowEnd, b.rowEnd) - Math.max(a.rowStart, b.rowStart) + 1);
  const colOverlap = Math.max(0, Math.min(a.colEnd, b.colEnd) - Math.max(a.colStart, b.colStart) + 1);
  return rowOverlap * colOverlap;
}

/** Intersection over Union: the standard geometric measure of how well two boxes overlap. */
export function iou(a: Box, b: Box): number {
  const inter = boxIntersectionArea(a, b);
  const union = boxArea(a) + boxArea(b) - inter;
  return union === 0 ? 0 : inter / union;
}

export const IOU_MATCH_THRESHOLD = 0.5;

function isPixelInBox(row: number, col: number, box: Box): boolean {
  return row >= box.rowStart && row <= box.rowEnd && col >= box.colStart && col <= box.colEnd;
}

export interface SegmentationMetrics {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  precision: number;
  recall: number;
  dice: number;
  iou: number;
}

/** Pixel-by-pixel segmentation scoring — every one of the grid's cells is a correct/incorrect classification. */
export function segmentationMetrics(gt: Box = GROUND_TRUTH_BOX, pred: Box, rows: number = GRID_ROWS, cols: number = GRID_COLS): SegmentationMetrics {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const g = isPixelInBox(r, c, gt);
      const p = isPixelInBox(r, c, pred);
      if (g && p) tp++;
      else if (!g && p) fp++;
      else if (g && !p) fn++;
      else tn++;
    }
  }
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  const dice = 2 * tp + fp + fn === 0 ? 0 : (2 * tp) / (2 * tp + fp + fn);
  const iouVal = tp + fp + fn === 0 ? 0 : tp / (tp + fp + fn);
  return { tp, fp, fn, tn, precision, recall, dice, iou: iouVal };
}
