import { describe, it, expect } from "vitest";
import {
  TRAIN_POINTS,
  trainXgboostClassifier,
  rbfScore,
  rbfPredict,
  SCOREBOARD,
  BEST_VALIDATION_ACCURACY,
} from "@/lib/math-core/capstone-tabular-kaggle-classifier";

describe("XGBoost-style round 1 (lambda=0) finds the true boundary with exact, clean numbers", () => {
  it("splits at x = 9.5 with G_left=6, H_left=10, G_right=-9, H_right=15", () => {
    const rounds = trainXgboostClassifier(TRAIN_POINTS, 1, 0, 1);
    expect(rounds[0].threshold).toBeCloseTo(9.5, 10);
    expect(rounds[0].leftValue).toBeCloseTo(-0.6, 10); // -6/10
    expect(rounds[0].rightValue).toBeCloseTo(0.6, 10); // 9/15
  });
});

describe("regularization (lambda=1) shrinks round 1's leaf values toward zero", () => {
  it("left leaf becomes -6/11, right leaf becomes 9/16 = 0.5625", () => {
    const rounds = trainXgboostClassifier(TRAIN_POINTS, 1, 1, 1);
    expect(rounds[0].threshold).toBeCloseTo(9.5, 10);
    expect(rounds[0].leftValue).toBeCloseTo(-6 / 11, 10);
    expect(rounds[0].rightValue).toBeCloseTo(0.5625, 10);
    // Both leaves are smaller in magnitude than the unregularized (lambda=0) case.
    expect(Math.abs(rounds[0].leftValue)).toBeLessThan(0.6);
    expect(Math.abs(rounds[0].rightValue)).toBeLessThan(0.6);
  });
});

describe("a too-narrow kernel bandwidth gets fooled by a single mislabeled neighbor", () => {
  it("gamma=1 mispredicts the clean validation point at x=15.25 (true label B) as A", () => {
    expect(rbfScore(TRAIN_POINTS, 15.25, 1)).toBeCloseTo(-0.10637383701931725, 10);
    expect(rbfPredict(TRAIN_POINTS, 15.25, 1)).toBe("A");
  });

  it("gamma=0.1 aggregates over enough neighbors to get it right", () => {
    expect(rbfScore(TRAIN_POINTS, 15.25, 0.1)).toBeCloseTo(3.0529767899068183, 10);
    expect(rbfPredict(TRAIN_POINTS, 15.25, 0.1)).toBe("B");
  });
});

describe("the scoreboard's exact accuracy numbers", () => {
  it("matches every entry's train/validation accuracy exactly", () => {
    const expected: Record<string, [number, number]> = {
      randomForest: [22 / 25, 11 / 12],
      xgboostPlain: [21 / 25, 23 / 24],
      xgboostRegularized: [20 / 25, 1],
      kernelNarrow: [1, 19 / 24],
      kernelTuned: [20 / 25, 1],
    };
    for (const entry of SCOREBOARD) {
      const [train, val] = expected[entry.key];
      expect(entry.trainAccuracy).toBeCloseTo(train, 10);
      expect(entry.validationAccuracy).toBeCloseTo(val, 10);
    }
  });

  it("best validation accuracy is a perfect 1.0, reached by more than one model", () => {
    expect(BEST_VALIDATION_ACCURACY).toBeCloseTo(1, 10);
    const winners = SCOREBOARD.filter((e) => Math.abs(e.validationAccuracy - 1) < 1e-9);
    expect(winners.length).toBeGreaterThanOrEqual(2);
  });

  it("the too-narrow kernel is the only model that overfits all the way to 100% training accuracy", () => {
    const overfit = SCOREBOARD.find((e) => e.key === "kernelNarrow")!;
    expect(overfit.trainAccuracy).toBeCloseTo(1, 10);
    expect(overfit.validationAccuracy).toBeLessThan(0.85);
  });
});

describe("regions cover the whole domain contiguously for every scoreboard entry", () => {
  it("every entry's regions chain start-to-end with no gaps", () => {
    for (const entry of SCOREBOARD) {
      expect(entry.regions[0].start).toBe(-1);
      expect(entry.regions[entry.regions.length - 1].end).toBe(25);
      for (let i = 1; i < entry.regions.length; i++) {
        expect(entry.regions[i].start).toBeCloseTo(entry.regions[i - 1].end, 10);
      }
    }
  });
});
