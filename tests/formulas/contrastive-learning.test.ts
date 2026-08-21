import { describe, expect, it } from "vitest";
import {
  IMAGES_BEFORE,
  CAPTIONS_BEFORE,
  IMAGES_AFTER,
  CAPTIONS_AFTER,
  similarityMatrix,
  rowSoftmax,
  contrastiveLoss,
  lerpPoints,
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

describe("interpolating between before and after — a continuous stand-in for training progress", () => {
  it("t=0 matches BEFORE exactly, t=1 matches AFTER exactly", () => {
    expect(lerpPoints(IMAGES_BEFORE, IMAGES_AFTER, 0)).toEqual(IMAGES_BEFORE);
    expect(lerpPoints(IMAGES_BEFORE, IMAGES_AFTER, 1)).toEqual(IMAGES_AFTER);
  });

  it("loss decreases monotonically and smoothly as t increases from 0 to 1", () => {
    const losses = Array.from({ length: 21 }, (_, i) => {
      const t = i / 20;
      const images = lerpPoints(IMAGES_BEFORE, IMAGES_AFTER, t);
      const captions = lerpPoints(CAPTIONS_BEFORE, CAPTIONS_AFTER, t);
      return contrastiveLoss(images, captions);
    });
    for (let i = 1; i < losses.length; i++) expect(losses[i]).toBeLessThan(losses[i - 1]);
    expect(losses[0]).toBeCloseTo(Math.log(3), 10);
    expect(losses[losses.length - 1]).toBeCloseTo(0.1124, 3);
  });

  it("crosses below 0.2 between t=0.75 and t=0.80, not before", () => {
    const lossAt = (t: number) => {
      const images = lerpPoints(IMAGES_BEFORE, IMAGES_AFTER, t);
      const captions = lerpPoints(CAPTIONS_BEFORE, CAPTIONS_AFTER, t);
      return contrastiveLoss(images, captions);
    };
    expect(lossAt(0.75)).toBeGreaterThan(0.2);
    expect(lossAt(0.8)).toBeLessThan(0.2);
  });
});
