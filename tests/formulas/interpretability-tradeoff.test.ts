import { describe, expect, it } from "vitest";
import {
  DATA,
  STUMP,
  SMALL_TREE,
  BLACK_BOX,
  predict,
  accuracy,
  regionCount,
  interpretabilityScore,
  misclassified,
} from "@/lib/math-core/interpretability-tradeoff";

describe("region models classify the 10-point dataset", () => {
  it("the stump gets 7/10 — it can't recover the noisy point at x=7,8,9", () => {
    expect(accuracy(STUMP)).toBeCloseTo(0.7, 10);
  });

  it("the small tree gets 9/10 — one more split fixes most of the noise", () => {
    expect(accuracy(SMALL_TREE)).toBeCloseTo(0.9, 10);
  });

  it("the black box gets 10/10 — enough splits to fit every point", () => {
    expect(accuracy(BLACK_BOX)).toBeCloseTo(1.0, 10);
  });

  it("the stump misclassifies exactly x=7,8,9", () => {
    expect(misclassified(STUMP).map((p) => p.x)).toEqual([7, 8, 9]);
  });

  it("the small tree misclassifies only x=10", () => {
    expect(misclassified(SMALL_TREE).map((p) => p.x)).toEqual([10]);
  });

  it("the black box misclassifies nothing", () => {
    expect(misclassified(BLACK_BOX)).toEqual([]);
  });
});

describe("predict resolves the correct region", () => {
  it("a point exactly at a threshold belongs to the region on its right", () => {
    expect(predict(STUMP, 3.5)).toBe("B");
    expect(predict(STUMP, 3.49)).toBe("A");
  });
});

describe("interpretability score falls as accuracy rises", () => {
  it("region counts are 2, 3, 4", () => {
    expect(regionCount(STUMP)).toBe(2);
    expect(regionCount(SMALL_TREE)).toBe(3);
    expect(regionCount(BLACK_BOX)).toBe(4);
  });

  it("interpretability scores are 1/2, 1/3, 1/4", () => {
    expect(interpretabilityScore(STUMP)).toBeCloseTo(0.5, 10);
    expect(interpretabilityScore(SMALL_TREE)).toBeCloseTo(1 / 3, 10);
    expect(interpretabilityScore(BLACK_BOX)).toBeCloseTo(0.25, 10);
  });

  it("accuracy strictly increases while interpretability strictly decreases across the three models", () => {
    const models = [STUMP, SMALL_TREE, BLACK_BOX];
    for (let i = 1; i < models.length; i++) {
      expect(accuracy(models[i])).toBeGreaterThan(accuracy(models[i - 1]));
      expect(interpretabilityScore(models[i])).toBeLessThan(interpretabilityScore(models[i - 1]));
    }
  });

  it("dataset has exactly 10 points, so accuracy denominators are as expected", () => {
    expect(DATA.length).toBe(10);
  });
});
