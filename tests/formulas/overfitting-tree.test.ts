import { describe, it, expect } from "vitest";
import {
  TRAIN_POINTS,
  VALIDATION_POINTS,
  buildTree,
  accuracy,
  treeRegions,
  TREE_DOMAIN,
} from "@/lib/math-core/overfitting-tree";

describe("buildTree at depth 1 finds the true boundary despite noise", () => {
  it("splits at 9.5 — the actual boundary between the true classes", () => {
    const tree = buildTree(TRAIN_POINTS, 1);
    expect(tree.kind).toBe("split");
    if (tree.kind === "split") expect(tree.threshold).toBeCloseTo(9.5, 10);
  });

  it("train accuracy is exactly 20/25 — the 5 noisy points are the only ones a single split gets wrong", () => {
    const tree = buildTree(TRAIN_POINTS, 1);
    expect(accuracy(tree, TRAIN_POINTS)).toBeCloseTo(20 / 25, 10);
  });

  it("validation accuracy is a perfect 1.0 — the single split generalizes cleanly", () => {
    const tree = buildTree(TRAIN_POINTS, 1);
    expect(accuracy(tree, VALIDATION_POINTS)).toBeCloseTo(1, 10);
  });
});

describe("depth 2 matches depth 1 exactly — no further split helps", () => {
  it("has the same train and validation accuracy as depth 1", () => {
    const depth1 = buildTree(TRAIN_POINTS, 1);
    const depth2 = buildTree(TRAIN_POINTS, 2);
    expect(accuracy(depth2, TRAIN_POINTS)).toBeCloseTo(accuracy(depth1, TRAIN_POINTS), 10);
    expect(accuracy(depth2, VALIDATION_POINTS)).toBeCloseTo(accuracy(depth1, VALIDATION_POINTS), 10);
  });
});

describe("train accuracy climbs while validation accuracy falls as depth grows", () => {
  it("matches the exact accuracy table at depths 1, 3, and 6", () => {
    const table: [number, number, number][] = [
      [1, 20 / 25, 1],
      [3, 22 / 25, 22 / 24],
      [6, 24 / 25, 20 / 24],
    ];
    for (const [depth, trainAcc, valAcc] of table) {
      const tree = buildTree(TRAIN_POINTS, depth);
      expect(accuracy(tree, TRAIN_POINTS)).toBeCloseTo(trainAcc, 10);
      expect(accuracy(tree, VALIDATION_POINTS)).toBeCloseTo(valAcc, 10);
    }
  });

  it("train accuracy never decreases as depth increases", () => {
    let prev = 0;
    for (let depth = 1; depth <= 6; depth++) {
      const acc = accuracy(buildTree(TRAIN_POINTS, depth), TRAIN_POINTS);
      expect(acc).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = acc;
    }
  });

  it("validation accuracy at max depth is strictly worse than at depth 1 — the overfitting itself", () => {
    const shallow = accuracy(buildTree(TRAIN_POINTS, 1), VALIDATION_POINTS);
    const deep = accuracy(buildTree(TRAIN_POINTS, 6), VALIDATION_POINTS);
    expect(deep).toBeLessThan(shallow);
  });
});

describe("treeRegions covers the whole domain with contiguous, non-overlapping intervals", () => {
  it("regions chain start-to-end with no gaps, at every depth", () => {
    for (let depth = 1; depth <= 6; depth++) {
      const regions = treeRegions(buildTree(TRAIN_POINTS, depth), TREE_DOMAIN[0], TREE_DOMAIN[1]);
      expect(regions[0].start).toBe(TREE_DOMAIN[0]);
      expect(regions[regions.length - 1].end).toBe(TREE_DOMAIN[1]);
      for (let i = 1; i < regions.length; i++) {
        expect(regions[i].start).toBe(regions[i - 1].end);
      }
    }
  });
});
