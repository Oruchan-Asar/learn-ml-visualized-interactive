import { describe, it, expect } from "vitest";
import { buildTree, normalizedImportances } from "@/lib/math-core/tree-feature-importance";

describe("tree-feature-importance", () => {
  it("x1 wins the root split, weighted by all 8 samples", () => {
    const tree = buildTree();
    expect(tree.rootSplit.feature).toBe("x1");
    expect(tree.rootSplit.threshold).toBe(4.5);
    expect(tree.rootSplit.gain).toBeCloseTo(0.5487949406953987, 12);
  });

  it("x2 only earns importance at the left child, where it catches the one mislabeled point", () => {
    const tree = buildTree();
    expect(tree.leftSplit?.feature).toBe("x2");
    expect(tree.leftSplit?.threshold).toBe(3.5);
    expect(tree.leftSplit?.gain).toBeCloseTo(0.8112781244591328, 12);
  });

  it("the right child is already pure — its best split has zero gain and contributes nothing", () => {
    const tree = buildTree();
    expect(tree.rightSplit?.gain).toBe(0);
  });

  it("x1 ends up more important than x2, but x2's contribution is far from zero", () => {
    const tree = buildTree();
    expect(tree.rawImportances.x1).toBeCloseTo(0.5487949406953987, 12);
    expect(tree.rawImportances.x2).toBeCloseTo(0.4056390622295664, 12);
    expect(tree.rawImportances.x1).toBeGreaterThan(tree.rawImportances.x2);
  });

  it("normalized importances sum to exactly 1", () => {
    const tree = buildTree();
    const norm = normalizedImportances(tree);
    expect(norm.x1 + norm.x2).toBeCloseTo(1, 12);
    expect(norm.x1).toBeCloseTo(0.574995168878684, 10);
  });
});
