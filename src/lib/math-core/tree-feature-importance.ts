import { bestSplit, type SplitDataPoint } from "./decision-tree-split";

/**
 * Eight points, two features. x1 alone almost perfectly separates the classes — except one point
 * (index 2) is mislabeled relative to its x1 value, and only x2 can catch it. That single exception
 * is where x2 earns any importance at all, and nowhere else.
 */
export interface Point {
  x1: number;
  x2: number;
  label: string;
}

export const DATA: Point[] = [
  { x1: 1, x2: 1, label: "A" },
  { x1: 2, x2: 2, label: "A" },
  { x1: 3, x2: 5, label: "B" },
  { x1: 4, x2: 2, label: "A" },
  { x1: 5, x2: 1, label: "B" },
  { x1: 6, x2: 2, label: "B" },
  { x1: 7, x2: 1, label: "B" },
  { x1: 8, x2: 2, label: "B" },
];

export type Feature = "x1" | "x2";

function toSplitPoints(points: Point[], feature: Feature): SplitDataPoint[] {
  return points.map((p) => ({ x: p[feature], label: p.label }));
}

export interface NodeSplit {
  feature: Feature;
  threshold: number;
  gain: number;
  nSamples: number;
}

/** Tries both features at this node, keeps whichever gives the higher information gain — exactly what training a tree does. */
export function bestFeatureSplit(points: Point[]): NodeSplit | null {
  const candidates: NodeSplit[] = [];
  for (const feature of ["x1", "x2"] as const) {
    const splitPoints = toSplitPoints(points, feature);
    const uniqueX = new Set(splitPoints.map((p) => p.x));
    if (uniqueX.size < 2) continue;
    const { threshold, result } = bestSplit(splitPoints);
    candidates.push({ feature, threshold, gain: result.informationGain, nSamples: points.length });
  }
  if (candidates.length === 0) return null;
  return candidates.reduce((best, c) => (c.gain > best.gain ? c : best));
}

export function splitByThreshold(points: Point[], feature: Feature, threshold: number): { left: Point[]; right: Point[] } {
  return {
    left: points.filter((p) => p[feature] < threshold),
    right: points.filter((p) => p[feature] >= threshold),
  };
}

export const TOTAL_SAMPLES = DATA.length;

export interface TreeResult {
  rootSplit: NodeSplit;
  leftSplit: NodeSplit | null;
  rightSplit: NodeSplit | null;
  rawImportances: Record<Feature, number>;
}

/** Builds a 2-level tree, attributing each split's weighted information gain to the feature it used. */
export function buildTree(data: Point[] = DATA): TreeResult {
  const rootSplit = bestFeatureSplit(data);
  if (!rootSplit) throw new Error("Need at least 2 distinct values on some feature to split the root.");
  const { left, right } = splitByThreshold(data, rootSplit.feature, rootSplit.threshold);
  const leftSplit = bestFeatureSplit(left);
  const rightSplit = bestFeatureSplit(right);

  const rawImportances: Record<Feature, number> = { x1: 0, x2: 0 };
  rawImportances[rootSplit.feature] += (data.length / TOTAL_SAMPLES) * rootSplit.gain;
  if (leftSplit && leftSplit.gain > 0) rawImportances[leftSplit.feature] += (left.length / TOTAL_SAMPLES) * leftSplit.gain;
  if (rightSplit && rightSplit.gain > 0) rawImportances[rightSplit.feature] += (right.length / TOTAL_SAMPLES) * rightSplit.gain;

  return { rootSplit, leftSplit, rightSplit, rawImportances };
}

export function normalizedImportances(result: TreeResult): Record<Feature, number> {
  const total = result.rawImportances.x1 + result.rawImportances.x2;
  return { x1: result.rawImportances.x1 / total, x2: result.rawImportances.x2 / total };
}
