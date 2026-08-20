import { TRAIN_POINTS, buildTree, predict, type TreeNode, type TreePoint, type TreeRegion } from "./overfitting-tree";

export const ENSEMBLE_TREE_DEPTH = 6;

/**
 * Fixed bootstrap resamples (sampling with replacement from TRAIN_POINTS, by index)
 * — precomputed once so every run of the app builds the exact same forest, rather
 * than reseeding randomness client-side.
 */
export const BOOTSTRAP_INDICES: number[][] = [
  [23, 14, 12, 15, 12, 13, 15, 19, 10, 10, 15, 14, 3, 24, 21, 9, 19, 17, 2, 12, 21, 7, 23, 8, 18],
  [13, 21, 24, 1, 18, 17, 1, 10, 3, 10, 1, 11, 21, 19, 15, 20, 16, 10, 10, 10, 0, 4, 6, 2, 8],
  [20, 24, 4, 3, 23, 1, 18, 15, 21, 13, 21, 15, 24, 8, 19, 15, 19, 24, 5, 8, 20, 3, 10, 18, 17],
  [16, 18, 14, 7, 13, 12, 19, 17, 1, 11, 14, 2, 6, 15, 14, 23, 13, 7, 20, 22, 2, 11, 12, 2, 15],
  [3, 12, 0, 19, 14, 6, 12, 3, 16, 12, 16, 5, 8, 8, 3, 18, 6, 20, 5, 19, 15, 11, 5, 4, 24],
  [20, 5, 8, 24, 1, 4, 19, 2, 20, 23, 11, 22, 1, 14, 7, 23, 8, 18, 7, 1, 6, 24, 22, 2, 7],
  [18, 9, 3, 19, 24, 19, 1, 4, 4, 16, 23, 9, 15, 3, 2, 14, 2, 16, 4, 23, 21, 9, 14, 4, 14],
  [13, 11, 16, 14, 20, 14, 8, 14, 16, 0, 4, 9, 17, 4, 7, 4, 19, 19, 23, 6, 16, 9, 18, 20, 5],
  [14, 8, 2, 10, 20, 17, 24, 20, 21, 19, 18, 10, 18, 23, 4, 6, 2, 11, 18, 4, 21, 24, 23, 8, 22],
  [12, 3, 1, 18, 9, 18, 11, 13, 13, 24, 9, 24, 17, 19, 13, 16, 9, 12, 10, 3, 6, 4, 0, 3, 3],
  [23, 12, 3, 20, 19, 22, 7, 4, 16, 18, 24, 18, 10, 1, 13, 9, 15, 18, 7, 3, 8, 16, 18, 10, 24],
  [24, 15, 14, 9, 17, 11, 17, 16, 14, 22, 4, 8, 9, 14, 3, 21, 3, 11, 5, 6, 7, 14, 19, 20, 15],
  [0, 2, 20, 22, 7, 18, 16, 11, 13, 22, 8, 18, 2, 17, 4, 19, 4, 6, 10, 5, 18, 0, 11, 19, 6],
  [19, 22, 18, 0, 12, 14, 24, 15, 3, 20, 21, 16, 5, 12, 22, 18, 0, 17, 8, 24, 3, 19, 19, 6, 12],
  [11, 7, 17, 20, 6, 1, 9, 11, 0, 17, 7, 0, 9, 2, 12, 16, 21, 3, 24, 6, 9, 11, 10, 22, 24],
  [4, 2, 5, 13, 8, 2, 8, 5, 22, 17, 9, 13, 9, 11, 17, 16, 10, 22, 15, 15, 1, 22, 6, 12, 19],
  [11, 24, 6, 23, 19, 10, 0, 8, 7, 16, 0, 20, 9, 14, 9, 4, 18, 4, 23, 24, 20, 14, 10, 21, 17],
  [22, 12, 23, 4, 1, 23, 9, 8, 6, 5, 18, 15, 3, 3, 3, 21, 11, 7, 3, 8, 9, 14, 13, 1, 4],
  [1, 5, 5, 11, 11, 8, 20, 1, 9, 5, 3, 8, 10, 3, 6, 1, 22, 5, 10, 21, 13, 11, 10, 9, 8],
  [6, 3, 3, 12, 11, 16, 1, 10, 19, 19, 12, 21, 7, 21, 9, 19, 13, 3, 24, 21, 19, 1, 12, 5, 23],
];

export const MAX_TREES = BOOTSTRAP_INDICES.length;

/** One deliberately overfit (max-depth) tree per bootstrap sample — the raw material bagging averages over. */
export const FOREST_TREES: TreeNode[] = BOOTSTRAP_INDICES.map((indices) =>
  buildTree(
    indices.map((i) => TRAIN_POINTS[i]),
    ENSEMBLE_TREE_DEPTH,
  ),
);

/** Majority vote across whichever trees are included. */
export function ensemblePredict(trees: TreeNode[], x: number): string {
  const counts = new Map<string, number>();
  for (const tree of trees) {
    const p = predict(tree, x);
    counts.set(p, (counts.get(p) ?? 0) + 1);
  }
  let bestLabel = "";
  let bestCount = -1;
  for (const [label, count] of counts) {
    if (count > bestCount) {
      bestLabel = label;
      bestCount = count;
    }
  }
  return bestLabel;
}

export function ensembleAccuracy(trees: TreeNode[], points: TreePoint[]): number {
  return points.filter((p) => ensemblePredict(trees, p.x) === p.label).length / points.length;
}

function collectThresholds(tree: TreeNode, out: number[]): void {
  if (tree.kind === "split") {
    out.push(tree.threshold);
    collectThresholds(tree.left, out);
    collectThresholds(tree.right, out);
  }
}

/** The ensemble's combined step function, merged into contiguous same-prediction bands. */
export function forestRegions(trees: TreeNode[], domainMin: number, domainMax: number): TreeRegion[] {
  const cuts: number[] = [];
  for (const tree of trees) collectThresholds(tree, cuts);
  const boundaries = [
    domainMin,
    ...[...new Set(cuts)].filter((c) => c > domainMin && c < domainMax).sort((a, b) => a - b),
    domainMax,
  ];

  const raw: TreeRegion[] = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const start = boundaries[i];
    const end = boundaries[i + 1];
    raw.push({ start, end, prediction: ensemblePredict(trees, (start + end) / 2) });
  }

  const merged: TreeRegion[] = [];
  for (const region of raw) {
    const last = merged[merged.length - 1];
    if (last && last.prediction === region.prediction) {
      last.end = region.end;
    } else {
      merged.push({ ...region });
    }
  }
  return merged;
}
