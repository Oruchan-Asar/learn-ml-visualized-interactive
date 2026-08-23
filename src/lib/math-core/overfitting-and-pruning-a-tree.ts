import {
  TRAIN_POINTS,
  VALIDATION_POINTS,
  TREE_DOMAIN,
  MAX_TREE_DEPTH,
  buildTree,
  accuracy,
  treeRegions,
  type TreeNode,
  type TreePoint,
} from "./overfitting-tree";

export { TRAIN_POINTS, VALIDATION_POINTS, TREE_DOMAIN, MAX_TREE_DEPTH, buildTree, accuracy, treeRegions };
export type { TreeNode, TreePoint };

/** Counts a tree's leaves — its |T| in the cost-complexity objective. */
export function numLeaves(tree: TreeNode): number {
  if (tree.kind === "leaf") return 1;
  return numLeaves(tree.left) + numLeaves(tree.right);
}

/**
 * Weakest-link pruning's objective: R_alpha(T) = R(T) + alpha * |T|.
 * R(T) is the tree's misclassification rate on `points` (1 - accuracy); |T| is its leaf count.
 * alpha=0 reduces to picking whichever tree has the lowest error, no matter how many leaves it took.
 */
export function costComplexity(tree: TreeNode, points: TreePoint[], alpha: number): number {
  return 1 - accuracy(tree, points) + alpha * numLeaves(tree);
}

export interface PruningRow {
  depth: number;
  leaves: number;
  trainError: number;
  validationAccuracy: number;
  costComplexity: number;
}

/** The cost-complexity table for every depth 1..MAX_TREE_DEPTH, at a fixed alpha. */
export function pruningTable(alpha: number): PruningRow[] {
  return Array.from({ length: MAX_TREE_DEPTH }, (_, i) => {
    const depth = i + 1;
    const tree = buildTree(TRAIN_POINTS, depth);
    return {
      depth,
      leaves: numLeaves(tree),
      trainError: 1 - accuracy(tree, TRAIN_POINTS),
      validationAccuracy: accuracy(tree, VALIDATION_POINTS),
      costComplexity: costComplexity(tree, TRAIN_POINTS, alpha),
    };
  });
}

/** The depth (1..MAX_TREE_DEPTH) whose tree minimizes R_alpha at this alpha — ties favor the shallower tree. */
export function bestDepthForAlpha(alpha: number): number {
  const rows = pruningTable(alpha);
  return rows.reduce((best, row) => (row.costComplexity < best.costComplexity ? row : best)).depth;
}

/** The shallowest depth reaching the best achievable validation accuracy — the target pruning should recover. */
export function bestValidationDepth(): number {
  const rows = pruningTable(0);
  const best = Math.max(...rows.map((r) => r.validationAccuracy));
  return rows.find((r) => r.validationAccuracy === best)!.depth;
}

/** A few illustrative alpha values spanning "no penalty" to "penalty dominates" for this dataset. */
export const PRESET_ALPHAS = [0, 0.01, 0.02, 0.05] as const;
