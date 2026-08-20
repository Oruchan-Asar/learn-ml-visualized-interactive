import { describe, it, expect } from "vitest";
import { VALIDATION_POINTS, TREE_DOMAIN } from "@/lib/math-core/overfitting-tree";
import { FOREST_TREES, MAX_TREES, ensemblePredict, ensembleAccuracy, forestRegions } from "@/lib/math-core/bagging";

describe("ensemblePredict takes a plain majority vote", () => {
  it("picks the label most trees agree on", () => {
    const leaf = (prediction: string) => ({ kind: "leaf" as const, prediction });
    const trees = [leaf("A"), leaf("A"), leaf("B")];
    expect(ensemblePredict(trees, 0)).toBe("A");
  });

  it("a single dissenting tree can't override the rest", () => {
    const leaf = (prediction: string) => ({ kind: "leaf" as const, prediction });
    const trees = [leaf("B"), leaf("B"), leaf("B"), leaf("B"), leaf("A")];
    expect(ensemblePredict(trees, 0)).toBe("B");
  });
});

describe("the forest matches the exact accuracy curve found by direct simulation", () => {
  it("validation accuracy climbs monotonically as more trees are added: 1→0.792, 4→0.833, 6→0.875, 19→0.917", () => {
    const checkpoints: [number, number][] = [
      [1, 0.792],
      [4, 0.833],
      [6, 0.875],
      [19, 0.917],
    ];
    for (const [n, expected] of checkpoints) {
      expect(ensembleAccuracy(FOREST_TREES.slice(0, n), VALIDATION_POINTS)).toBeCloseTo(expected, 3);
    }
  });

  it("validation accuracy never decreases as more trees are added", () => {
    let prev = 0;
    for (let n = 1; n <= MAX_TREES; n++) {
      const acc = ensembleAccuracy(FOREST_TREES.slice(0, n), VALIDATION_POINTS);
      expect(acc).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = acc;
    }
  });

  it("the full 20-tree ensemble beats the single max-depth tree trained on all the data", () => {
    const singleOverfitTreeValAcc = 0.833; // from the overfitting-a-tree chapter's own depth-6 result
    expect(ensembleAccuracy(FOREST_TREES, VALIDATION_POINTS)).toBeGreaterThan(singleOverfitTreeValAcc);
  });
});

describe("worked example: individual trees disagree at x=14.25, small vs. larger juries differ", () => {
  it("the first 3 trees' majority vote is wrong; the first 5 trees' majority vote is right", () => {
    const point = VALIDATION_POINTS.find((p) => p.x === 14.25);
    expect(point?.label).toBe("B");
    expect(ensemblePredict(FOREST_TREES.slice(0, 3), 14.25)).toBe("A");
    expect(ensemblePredict(FOREST_TREES.slice(0, 5), 14.25)).toBe("B");
  });
});

describe("forestRegions covers the whole domain with contiguous, merged bands", () => {
  it("chains start-to-end with no gaps and no two adjacent bands sharing a prediction", () => {
    const regions = forestRegions(FOREST_TREES, TREE_DOMAIN[0], TREE_DOMAIN[1]);
    expect(regions[0].start).toBe(TREE_DOMAIN[0]);
    expect(regions[regions.length - 1].end).toBe(TREE_DOMAIN[1]);
    for (let i = 1; i < regions.length; i++) {
      expect(regions[i].start).toBe(regions[i - 1].end);
      expect(regions[i].prediction).not.toBe(regions[i - 1].prediction);
    }
  });
});
