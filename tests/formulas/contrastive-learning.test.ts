import { describe, expect, it } from "vitest";
import {
  IMAGES_BEFORE,
  CAPTIONS_BEFORE,
  IMAGES_AFTER,
  CAPTIONS_AFTER,
  similarityMatrix,
  rowSoftmax,
  contrastiveLoss,
} from "@/lib/math-core/contrastive-learning";

describe("before training — every embedding collapsed to the same point", () => {
  it("the similarity matrix is all zeros — no pair is any closer than any other", () => {
    const matrix = similarityMatrix(IMAGES_BEFORE, CAPTIONS_BEFORE);
    for (const row of matrix) for (const v of row) expect(v).toBeCloseTo(0, 10);
  });

  it("softmax gives exactly uniform 1/3 probability to every caption, for every image", () => {
    const probs = rowSoftmax(similarityMatrix(IMAGES_BEFORE, CAPTIONS_BEFORE));
    for (const row of probs) for (const p of row) expect(p).toBeCloseTo(1 / 3, 10);
  });

  it("the loss is exactly ln(3) — the entropy of a uniform guess over 3 options", () => {
    expect(contrastiveLoss(IMAGES_BEFORE, CAPTIONS_BEFORE)).toBeCloseTo(Math.log(3), 10);
  });
});

describe("after training — Chapter 1's placements", () => {
  it("each image's true caption gets the highest probability by a wide margin", () => {
    const probs = rowSoftmax(similarityMatrix(IMAGES_AFTER, CAPTIONS_AFTER));
    probs.forEach((row, i) => {
      const trueProb = row[i];
      const others = row.filter((_, j) => j !== i);
      expect(trueProb).toBeGreaterThan(Math.max(...others) * 5);
    });
  });

  it("the loss drops to about 0.11 — roughly a tenth of the untrained loss", () => {
    const loss = contrastiveLoss(IMAGES_AFTER, CAPTIONS_AFTER);
    expect(loss).toBeCloseTo(0.1124, 3);
    expect(loss).toBeLessThan(Math.log(3) / 5);
  });
});
