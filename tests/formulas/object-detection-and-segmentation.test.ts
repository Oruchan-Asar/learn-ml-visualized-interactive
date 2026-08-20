import { describe, it, expect } from "vitest";
import { iou, predictedBox, GROUND_TRUTH_BOX, segmentationMetrics, boxArea, IOU_MATCH_THRESHOLD } from "@/lib/math-core/object-detection-and-segmentation";

describe("object-detection-and-segmentation", () => {
  it("a perfectly aligned prediction scores IoU of exactly 1", () => {
    expect(boxArea(GROUND_TRUTH_BOX)).toBe(6);
    expect(iou(GROUND_TRUTH_BOX, predictedBox(0))).toBe(1);
  });

  it("a 1-column shift lands exactly at the standard 0.5 IoU match threshold", () => {
    expect(iou(GROUND_TRUTH_BOX, predictedBox(1))).toBe(0.5);
    expect(iou(GROUND_TRUTH_BOX, predictedBox(1))).toBeGreaterThanOrEqual(IOU_MATCH_THRESHOLD);
  });

  it("a 2-column shift drops well below the match threshold", () => {
    expect(iou(GROUND_TRUTH_BOX, predictedBox(2))).toBeCloseTo(0.2, 10);
    expect(iou(GROUND_TRUTH_BOX, predictedBox(2))).toBeLessThan(IOU_MATCH_THRESHOLD);
  });

  it("pixel-level segmentation metrics agree with box IoU at the same offset", () => {
    const seg = segmentationMetrics(GROUND_TRUTH_BOX, predictedBox(1));
    expect(seg.tp).toBe(4);
    expect(seg.fp).toBe(2);
    expect(seg.fn).toBe(2);
    expect(seg.iou).toBe(0.5);
    expect(seg.dice).toBeCloseTo(2 / 3, 10);
  });

  it("Dice equals precision equals recall when ground truth and prediction have equal area", () => {
    const seg = segmentationMetrics(GROUND_TRUTH_BOX, predictedBox(1));
    expect(seg.precision).toBe(seg.recall);
    expect(seg.dice).toBe(seg.precision);
  });
});
