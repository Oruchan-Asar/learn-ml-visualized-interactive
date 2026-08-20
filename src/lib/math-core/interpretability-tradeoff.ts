export interface LabeledPoint {
  x: number;
  label: string;
}

/**
 * A noisy 1D dataset: mostly three true blocks (A, B, A) but the last point breaks the
 * pattern, so only a model with enough decision boundaries can classify it correctly too.
 */
export const DATA: LabeledPoint[] = [
  { x: 1, label: "A" },
  { x: 2, label: "A" },
  { x: 3, label: "A" },
  { x: 4, label: "B" },
  { x: 5, label: "B" },
  { x: 6, label: "B" },
  { x: 7, label: "A" },
  { x: 8, label: "A" },
  { x: 9, label: "A" },
  { x: 10, label: "B" },
];

export const DOMAIN: [number, number] = [0, 11];

export interface RegionModel {
  name: string;
  /** Sorted ascending; splits the domain into thresholds.length + 1 regions. */
  thresholds: number[];
  /** Predicted label for each region, left to right. */
  regionLabels: string[];
}

export const STUMP: RegionModel = {
  name: "Stump (1 split)",
  thresholds: [3.5],
  regionLabels: ["A", "B"],
};

export const SMALL_TREE: RegionModel = {
  name: "Small tree (2 splits)",
  thresholds: [3.5, 6.5],
  regionLabels: ["A", "B", "A"],
};

export const BLACK_BOX: RegionModel = {
  name: "Black box (3 splits)",
  thresholds: [3.5, 6.5, 9.5],
  regionLabels: ["A", "B", "A", "B"],
};

export const MODELS: RegionModel[] = [STUMP, SMALL_TREE, BLACK_BOX];

/** Which region index x falls into, given the model's sorted thresholds. */
export function regionIndex(model: RegionModel, x: number): number {
  let i = 0;
  while (i < model.thresholds.length && x >= model.thresholds[i]) i++;
  return i;
}

export function predict(model: RegionModel, x: number): string {
  return model.regionLabels[regionIndex(model, x)];
}

export function accuracy(model: RegionModel, data: LabeledPoint[] = DATA): number {
  const correct = data.filter((p) => predict(model, p.x) === p.label).length;
  return correct / data.length;
}

export function regionCount(model: RegionModel): number {
  return model.regionLabels.length;
}

/** A simple, decreasing proxy for "how easily a person could restate this model's rule": fewer regions, higher score. */
export function interpretabilityScore(model: RegionModel): number {
  return 1 / regionCount(model);
}

export function misclassified(model: RegionModel, data: LabeledPoint[] = DATA): LabeledPoint[] {
  return data.filter((p) => predict(model, p.x) !== p.label);
}
