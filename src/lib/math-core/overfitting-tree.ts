import { entropy } from "./entropy";

export interface TreePoint {
  x: number;
  label: string;
}

export type TreeNode =
  | { kind: "leaf"; prediction: string }
  | { kind: "split"; threshold: number; left: TreeNode; right: TreeNode };

function entropyOf(points: TreePoint[]): number {
  if (points.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const p of points) counts.set(p.label, (counts.get(p.label) ?? 0) + 1);
  const probabilities = [...counts.values()].map((c) => c / points.length);
  return entropy(probabilities);
}

function majorityLabel(points: TreePoint[]): string {
  const counts = new Map<string, number>();
  for (const p of points) counts.set(p.label, (counts.get(p.label) ?? 0) + 1);
  let best = points[0].label;
  let bestCount = -1;
  for (const [label, count] of counts) {
    if (count > bestCount) {
      best = label;
      bestCount = count;
    }
  }
  return best;
}

function bestThreshold(points: TreePoint[]): { threshold: number; informationGain: number } | null {
  const xs = [...new Set(points.map((p) => p.x))].sort((a, b) => a - b);
  const parentEntropy = entropyOf(points);
  let best: { threshold: number; informationGain: number } | null = null;
  for (let i = 0; i < xs.length - 1; i++) {
    const threshold = (xs[i] + xs[i + 1]) / 2;
    const left = points.filter((p) => p.x < threshold);
    const right = points.filter((p) => p.x >= threshold);
    const weighted =
      (left.length / points.length) * entropyOf(left) + (right.length / points.length) * entropyOf(right);
    const informationGain = parentEntropy - weighted;
    if (!best || informationGain > best.informationGain) best = { threshold, informationGain };
  }
  return best;
}

/** Grows greedily until maxDepth, a node is pure, or fewer than 2 points remain — a real tree's default stopping rule. */
export function buildTree(points: TreePoint[], maxDepth: number, depth = 0): TreeNode {
  const prediction = majorityLabel(points);
  if (depth >= maxDepth || entropyOf(points) === 0 || points.length < 2) {
    return { kind: "leaf", prediction };
  }
  const split = bestThreshold(points);
  if (!split || split.informationGain <= 1e-9) {
    return { kind: "leaf", prediction };
  }
  const left = points.filter((p) => p.x < split.threshold);
  const right = points.filter((p) => p.x >= split.threshold);
  return {
    kind: "split",
    threshold: split.threshold,
    left: buildTree(left, maxDepth, depth + 1),
    right: buildTree(right, maxDepth, depth + 1),
  };
}

export function predict(tree: TreeNode, x: number): string {
  if (tree.kind === "leaf") return tree.prediction;
  return x < tree.threshold ? predict(tree.left, x) : predict(tree.right, x);
}

export function accuracy(tree: TreeNode, points: TreePoint[]): number {
  return points.filter((p) => predict(tree, p.x) === p.label).length / points.length;
}

export interface TreeRegion {
  start: number;
  end: number;
  prediction: string;
}

/** Flattens the tree into the leaf intervals it partitions [domainMin, domainMax] into, left to right. */
export function treeRegions(tree: TreeNode, domainMin: number, domainMax: number): TreeRegion[] {
  if (tree.kind === "leaf") return [{ start: domainMin, end: domainMax, prediction: tree.prediction }];
  return [
    ...treeRegions(tree.left, domainMin, tree.threshold),
    ...treeRegions(tree.right, tree.threshold, domainMax),
  ];
}

function trueLabel(x: number): string {
  return x >= 10 ? "B" : "A";
}

/** These five points are deliberately mislabeled — training-only noise the true rule doesn't have. */
const NOISE_X = new Set([2, 5, 15, 19, 22]);

export const TRAIN_POINTS: TreePoint[] = Array.from({ length: 25 }, (_, x) => {
  const label = trueLabel(x);
  return { x, label: NOISE_X.has(x) ? (label === "A" ? "B" : "A") : label };
});

/** Clean (no noise) points at x+0.25 offsets — never seen in training, and never exactly on a candidate split. */
export const VALIDATION_POINTS: TreePoint[] = Array.from({ length: 24 }, (_, i) => {
  const x = i + 0.25;
  return { x, label: trueLabel(x) };
});

export const MAX_TREE_DEPTH = 6;
export const TREE_DOMAIN: [number, number] = [-1, 25];
