import { describe, expect, it } from "vitest";
import {
  GRADIENTS,
  fullBatchAverage,
  shardAverage,
  toShardSummaries,
  naiveAverage,
  weightedAverage,
  EQUAL_SHARDS,
  UNEQUAL_SHARDS,
  CHECKPOINT_SHARDS,
} from "@/lib/math-core/distributed-training";

describe("distributed-training", () => {
  it("the full-batch average of all six gradients is 2", () => {
    expect(fullBatchAverage(GRADIENTS)).toBeCloseTo(2, 10);
  });

  it("equal shards: each shard's own average", () => {
    const avgs = EQUAL_SHARDS.map(shardAverage);
    expect(avgs).toEqual([1, 3, 2]);
  });

  it("equal shards: naive (unweighted) averaging matches the full-batch average", () => {
    const avgs = EQUAL_SHARDS.map(shardAverage);
    expect(naiveAverage(avgs)).toBeCloseTo(2, 10);
    expect(naiveAverage(avgs)).toBeCloseTo(fullBatchAverage(GRADIENTS), 10);
  });

  it("equal shards: weighted averaging also matches, since every shard has the same size", () => {
    const summaries = toShardSummaries(EQUAL_SHARDS);
    expect(weightedAverage(summaries)).toBeCloseTo(2, 10);
  });

  it("unequal shards: naive averaging gives the wrong answer", () => {
    const avgs = UNEQUAL_SHARDS.map(shardAverage);
    expect(avgs).toEqual([1, 2.5]);
    expect(naiveAverage(avgs)).toBeCloseTo(1.75, 10);
    expect(naiveAverage(avgs)).not.toBeCloseTo(fullBatchAverage(GRADIENTS), 1);
  });

  it("unequal shards: weighted averaging still matches the full-batch average", () => {
    const summaries = toShardSummaries(UNEQUAL_SHARDS);
    expect(summaries).toEqual([
      { size: 2, avg: 1 },
      { size: 4, avg: 2.5 },
    ]);
    expect(weightedAverage(summaries)).toBeCloseTo(2, 10);
  });

  it("checkpoint shards: a third unseen partition where naive averaging is wrong but weighted matches", () => {
    const summaries = toShardSummaries(CHECKPOINT_SHARDS);
    expect(summaries).toEqual([
      { size: 1, avg: 4 },
      { size: 1, avg: -2 },
      { size: 4, avg: 2.5 },
    ]);
    const avgs = summaries.map((s) => s.avg);
    expect(naiveAverage(avgs)).toBeCloseTo(1.5, 10);
    expect(weightedAverage(summaries)).toBeCloseTo(2, 10);
    expect(weightedAverage(summaries)).toBeCloseTo(fullBatchAverage(GRADIENTS), 10);
  });
});
