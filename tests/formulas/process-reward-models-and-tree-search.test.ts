import { describe, it, expect } from "vitest";
import { REASONING_TREE, allPaths, bestPath, greedyPath } from "@/lib/math-core/process-reward-models-and-tree-search";

describe("allPaths", () => {
  it("enumerates all 6 root-to-leaf paths with the hand-computed product scores", () => {
    const paths = allPaths();
    expect(paths).toHaveLength(6);
    const byIds = Object.fromEntries(paths.map((p) => [p.ids.join(""), p.product]));
    expect(byIds["AA1"]).toBeCloseTo(0.27, 10); // 0.9 * 0.3
    expect(byIds["AA2"]).toBeCloseTo(0.18, 10); // 0.9 * 0.2
    expect(byIds["BB1"]).toBeCloseTo(0.3, 10); // 0.5 * 0.6
    expect(byIds["BB2"]).toBeCloseTo(0.2, 10); // 0.5 * 0.4
    expect(byIds["CC1"]).toBeCloseTo(0.07, 10); // 0.35 * 0.2
    expect(byIds["CC2"]).toBeCloseTo(0.3325, 10); // 0.35 * 0.95
  });
});

describe("bestPath", () => {
  it("tree search finds C -> C2 as the true best path, despite C having the WEAKEST first step", () => {
    const best = bestPath();
    expect(best.ids).toEqual(["C", "C2"]);
    expect(best.product).toBeCloseTo(0.3325, 10);
    const cFirstStep = REASONING_TREE.children!.find((c) => c.id === "C")!;
    const aFirstStep = REASONING_TREE.children!.find((c) => c.id === "A")!;
    expect(cFirstStep.score).toBeLessThan(aFirstStep.score);
  });
});

describe("greedyPath", () => {
  it("greedy commits to A (the best-looking first step) then A1, landing on the WORST of the three branches", () => {
    const greedy = greedyPath();
    expect(greedy.ids).toEqual(["A", "A1"]);
    expect(greedy.product).toBeCloseTo(0.27, 10);
  });

  it("greedy's path is strictly worse than what full tree search finds", () => {
    expect(greedyPath().product).toBeLessThan(bestPath().product);
  });
});
