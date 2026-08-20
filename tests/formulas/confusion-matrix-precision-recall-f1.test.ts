import { describe, expect, it } from "vitest";
import { confusionMatrix, accuracy, precision, recall, f1Score, TRUE_LABELS, DUMB_PREDICTIONS, SMART_PREDICTIONS } from "@/lib/math-core/confusion-matrix-precision-recall-f1";

describe("the dumb classifier (always predicts negative)", () => {
  const cm = confusionMatrix(TRUE_LABELS, DUMB_PREDICTIONS);

  it("gets 9 true negatives and 1 false negative — never a true or false positive", () => {
    expect(cm).toEqual({ truePositive: 0, falsePositive: 0, trueNegative: 9, falseNegative: 1 });
  });

  it("reaches 90% accuracy despite never catching the one positive case", () => {
    expect(accuracy(cm)).toBeCloseTo(0.9, 10);
  });

  it("precision and recall are both exactly 0 — it never predicts positive at all", () => {
    expect(precision(cm)).toBe(0);
    expect(recall(cm)).toBe(0);
    expect(f1Score(cm)).toBe(0);
  });
});

describe("the 'smart' classifier (catches the positive, one false alarm)", () => {
  const cm = confusionMatrix(TRUE_LABELS, SMART_PREDICTIONS);

  it("gets 1 true positive, 1 false positive, 8 true negatives, 0 false negatives", () => {
    expect(cm).toEqual({ truePositive: 1, falsePositive: 1, trueNegative: 8, falseNegative: 0 });
  });

  it("also reaches exactly 90% accuracy — identical to the dumb classifier", () => {
    expect(accuracy(cm)).toBeCloseTo(0.9, 10);
  });

  it("precision is 0.5, recall is 1.0, F1 is exactly 2/3", () => {
    expect(precision(cm)).toBeCloseTo(0.5, 10);
    expect(recall(cm)).toBeCloseTo(1, 10);
    expect(f1Score(cm)).toBeCloseTo(2 / 3, 10);
  });
});

describe("accuracy alone cannot distinguish these two very different classifiers", () => {
  it("both score exactly 0.9 accuracy, but F1 tells them apart completely", () => {
    const dumbCm = confusionMatrix(TRUE_LABELS, DUMB_PREDICTIONS);
    const smartCm = confusionMatrix(TRUE_LABELS, SMART_PREDICTIONS);
    expect(accuracy(dumbCm)).toBeCloseTo(accuracy(smartCm), 10);
    expect(f1Score(smartCm)).toBeGreaterThan(f1Score(dumbCm));
  });
});
