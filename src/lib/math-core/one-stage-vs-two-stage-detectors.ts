/**
 * A one-stage detector (YOLO-style) scores every candidate box in a single dense pass, cheaply but
 * coarsely. A two-stage detector (Faster R-CNN-style) first runs a cheap proposal pass over every
 * box, then spends a second, expensive classifier only on the boxes that pass a proposal threshold —
 * slower overall, but precise on whatever survives. Both pipelines are modeled here as deterministic
 * roundings of each box's true objectness confidence onto a coarser grid, so every score and every
 * cost is exact and hand-checkable.
 */

export interface DetectionBox {
  id: string;
  trueConfidence: number;
}

/** A small fixed scene: six candidate boxes with known ground-truth objectness confidence. */
export const BOXES: DetectionBox[] = [
  { id: "A", trueConfidence: 0.92 },
  { id: "B", trueConfidence: 0.77 },
  { id: "C", trueConfidence: 0.47 },
  { id: "D", trueConfidence: 0.18 },
  { id: "E", trueConfidence: 0.84 },
  { id: "F", trueConfidence: 0.56 },
];

export const DETECTION_THRESHOLD = 0.5;
export const PROPOSAL_THRESHOLD = 0.5;
export const ONE_STAGE_GRID = 0.1;
export const PROPOSAL_GRID = 0.25;

export const ONE_STAGE_COST_PER_BOX = 1;
export const PROPOSAL_COST_PER_BOX = 0.2;
export const REFINE_COST_PER_BOX = 3;

/** Rounds a value onto a fixed grid, then cleans up floating-point noise from the division. */
function roundToGrid(value: number, grid: number): number {
  const steps = Math.round(value / grid);
  return Math.round(steps * grid * 1000) / 1000;
}

/** One-stage: every box gets a single coarse pass, quantized onto a 0.1 grid. */
export function oneStageScore(trueConfidence: number): number {
  return roundToGrid(trueConfidence, ONE_STAGE_GRID);
}

/** Two-stage's first pass: a cheap, coarser proposal score on a 0.25 grid. */
export function proposalScore(trueConfidence: number): number {
  return roundToGrid(trueConfidence, PROPOSAL_GRID);
}

/** Two-stage's final score: the exact confidence for boxes whose proposal cleared the threshold, else dropped. */
export function twoStageScore(trueConfidence: number): number {
  return proposalScore(trueConfidence) >= PROPOSAL_THRESHOLD ? trueConfidence : 0;
}

export function isDetected(score: number): boolean {
  return score >= DETECTION_THRESHOLD;
}

/** Total one-stage compute: every box gets exactly one full evaluation. */
export function oneStageCost(boxes: DetectionBox[] = BOXES): number {
  return boxes.length * ONE_STAGE_COST_PER_BOX;
}

/** Total two-stage compute: a cheap proposal pass over everything, plus an expensive refine pass on survivors. */
export function twoStageCost(boxes: DetectionBox[] = BOXES): number {
  const passed = boxes.filter((b) => proposalScore(b.trueConfidence) >= PROPOSAL_THRESHOLD).length;
  return boxes.length * PROPOSAL_COST_PER_BOX + passed * REFINE_COST_PER_BOX;
}

/** How many boxes survive two-stage's proposal filter and reach the expensive second pass. */
export function proposalSurvivorCount(boxes: DetectionBox[] = BOXES): number {
  return boxes.filter((b) => proposalScore(b.trueConfidence) >= PROPOSAL_THRESHOLD).length;
}

/** Box ids where one-stage's coarser rounding and two-stage's final decision disagree. */
export function detectionDisagreements(boxes: DetectionBox[] = BOXES): string[] {
  return boxes
    .filter((b) => isDetected(oneStageScore(b.trueConfidence)) !== isDetected(twoStageScore(b.trueConfidence)))
    .map((b) => b.id);
}
