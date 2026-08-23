import { describe, it, expect } from "vitest";
import {
  TRAIN_POINTS,
  buildTree,
  numLeaves,
  costComplexity,
  pruningTable,
  bestDepthForAlpha,
  bestValidationDepth,
} from "@/lib/math-core/overfitting-and-pruning-a-tree";

describe("numLeaves counts a tree's leaves exactly", () => {
  it("depth 1 has 2 leaves — one split, two sides", () => {
    expect(numLeaves(buildTree(TRAIN_POINTS, 1))).toBe(2);
  });

  it("depth 3 has 6 leaves, depth 5 has 10, depth 6 has 11 — the exact leaf-count table", () => {
    expect(numLeaves(buildTree(TRAIN_POINTS, 3))).toBe(6);
    expect(numLeaves(buildTree(TRAIN_POINTS, 5))).toBe(10);
    expect(numLeaves(buildTree(TRAIN_POINTS, 6))).toBe(11);
  });

  it("leaf count never decreases as depth grows", () => {
    let prev = 0;
    for (let depth = 1; depth <= 6; depth++) {
      const leaves = numLeaves(buildTree(TRAIN_POINTS, depth));
      expect(leaves).toBeGreaterThanOrEqual(prev);
      prev = leaves;
    }
  });
});

describe("costComplexity combines training error with a per-leaf penalty", () => {
  it("at alpha=0, cost-complexity is exactly the training error — the depth-5 tree (24/25, 10 leaves) scores 0.04", () => {
    const tree = buildTree(TRAIN_POINTS, 5);
    expect(costComplexity(tree, TRAIN_POINTS, 0)).toBeCloseTo(1 / 25, 10);
  });

  it("at alpha=0.01, the depth-1 tree (20/25 train, 2 leaves) scores 0.2 + 0.01*2 = 0.22 by hand", () => {
    const tree = buildTree(TRAIN_POINTS, 1);
    expect(costComplexity(tree, TRAIN_POINTS, 0.01)).toBeCloseTo(0.22, 10);
  });

  it("at alpha=0.03, the depth-5 tree (0.04 train error, 10 leaves) scores 0.04 + 0.3 = 0.34 by hand", () => {
    const tree = buildTree(TRAIN_POINTS, 5);
    expect(costComplexity(tree, TRAIN_POINTS, 0.03)).toBeCloseTo(0.34, 10);
  });
});

describe("pruningTable reports one row per depth, all derived from the same tree", () => {
  it("has MAX_TREE_DEPTH rows, depths 1..6 in order", () => {
    const rows = pruningTable(0);
    expect(rows.map((r) => r.depth)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("matches the known depth-1 and depth-5 figures", () => {
    const rows = pruningTable(0);
    const d1 = rows.find((r) => r.depth === 1)!;
    const d5 = rows.find((r) => r.depth === 5)!;
    expect(d1.leaves).toBe(2);
    expect(d1.trainError).toBeCloseTo(0.2, 10);
    expect(d1.validationAccuracy).toBeCloseTo(1, 10);
    expect(d5.leaves).toBe(10);
    expect(d5.trainError).toBeCloseTo(0.04, 10);
    expect(d5.validationAccuracy).toBeCloseTo(20 / 24, 10);
  });
});

describe("bestDepthForAlpha shows the winner shrinking as the leaf penalty grows", () => {
  it("at alpha=0, the deepest tree that actually improves training error wins (depth 5, not the redundant depth 6)", () => {
    expect(bestDepthForAlpha(0)).toBe(5);
  });

  it("at alpha=0.01, depth 5 still wins — the penalty isn't yet large enough to flip the decision", () => {
    expect(bestDepthForAlpha(0.01)).toBe(5);
  });

  it("at alpha=0.02, depth 1 and depth 5 are an exact tie (both score 0.24) — resolved in favor of the smaller tree", () => {
    const rows = pruningTable(0.02);
    const d1 = rows.find((r) => r.depth === 1)!;
    const d5 = rows.find((r) => r.depth === 5)!;
    expect(d1.costComplexity).toBeCloseTo(0.24, 10);
    expect(d1.costComplexity).toBeCloseTo(d5.costComplexity, 6);
    expect(bestDepthForAlpha(0.02)).toBe(1);
  });

  it("at alpha=0.03, the leaf penalty flips the winner to the shallow depth-1 tree outright", () => {
    expect(bestDepthForAlpha(0.03)).toBe(1);
  });

  it("bestValidationDepth (1) matches bestDepthForAlpha's answer once alpha is large enough", () => {
    expect(bestDepthForAlpha(0.03)).toBe(bestValidationDepth());
  });
});
