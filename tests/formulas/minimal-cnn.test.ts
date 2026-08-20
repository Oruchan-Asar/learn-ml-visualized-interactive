import { describe, expect, it } from "vitest";
import {
  FEATURE_MAP,
  RELU_MAP,
  POOLED_RELU,
  POOLED_RAW,
  FLATTENED_RELU,
  FLATTENED_RAW,
  CLASS_LABELS,
  TRUE_CLASS_INDEX,
  computeLogits,
  computePipeline,
  argmax,
} from "@/lib/math-core/minimal-cnn";

describe("minimal CNN pipeline", () => {
  it("computes the raw convolution feature map with both positive and negative responses", () => {
    expect(FEATURE_MAP[0]).toEqual([-3, -3, 3, 3]);
    expect(FEATURE_MAP.every((row) => row.every((v, c) => v === FEATURE_MAP[0][c]))).toBe(true);
  });

  it("ReLU clips every negative response to zero and leaves positives untouched", () => {
    expect(RELU_MAP[0]).toEqual([0, 0, 3, 3]);
  });

  it("max-pools the ReLU'd map down to 2x2", () => {
    expect(POOLED_RELU).toEqual([
      [0, 3],
      [0, 3],
    ]);
  });

  it("max-pools the raw (pre-ReLU) map down to 2x2, keeping the negative values", () => {
    expect(POOLED_RAW).toEqual([
      [-3, 3],
      [-3, 3],
    ]);
  });

  it("flattens each pooled map in row-major order", () => {
    expect(FLATTENED_RELU).toEqual([0, 3, 0, 3]);
    expect(FLATTENED_RAW).toEqual([-3, 3, -3, 3]);
  });

  it("with ReLU: the dense layer correctly predicts the true class", () => {
    const logits = computeLogits(FLATTENED_RELU);
    expect(logits).toEqual([4, -4]);
    expect(argmax(logits)).toBe(TRUE_CLASS_INDEX);
  });

  it("without ReLU: positive and negative evidence cancel, flipping the prediction to the wrong class", () => {
    const logits = computeLogits(FLATTENED_RAW);
    expect(logits).toEqual([-2, 2]);
    expect(argmax(logits)).not.toBe(TRUE_CLASS_INDEX);
  });

  it("computePipeline(true) matches the ReLU path end to end", () => {
    const pipeline = computePipeline(true);
    expect(pipeline.pooled).toEqual(POOLED_RELU);
    expect(pipeline.flattened).toEqual(FLATTENED_RELU);
    expect(pipeline.logits).toEqual([4, -4]);
    expect(pipeline.predictedIndex).toBe(TRUE_CLASS_INDEX);
    expect(CLASS_LABELS[pipeline.predictedIndex]).toBe("Edge detected");
  });

  it("computePipeline(false) matches the no-ReLU path end to end", () => {
    const pipeline = computePipeline(false);
    expect(pipeline.pooled).toEqual(POOLED_RAW);
    expect(pipeline.flattened).toEqual(FLATTENED_RAW);
    expect(pipeline.logits).toEqual([-2, 2]);
    expect(pipeline.predictedIndex).not.toBe(TRUE_CLASS_INDEX);
  });
});
