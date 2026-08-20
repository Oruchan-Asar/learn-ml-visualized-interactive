import { describe, expect, it } from "vitest";
import {
  FEATURE_MAP,
  MAX_POOLED,
  AVG_POOLED,
  OUTPUT_SIZE,
  maxPoolAt,
  avgPoolAt,
} from "@/lib/math-core/pooling";

describe("pooling", () => {
  it("computes the max-pooled value at each output position", () => {
    expect(maxPoolAt(0, 0)).toBe(6);
    expect(maxPoolAt(0, 1)).toBe(0);
    expect(maxPoolAt(1, 0)).toBe(0);
    expect(maxPoolAt(1, 1)).toBe(4);
  });

  it("computes the average-pooled value at each output position", () => {
    expect(avgPoolAt(0, 0)).toBe(3);
    expect(avgPoolAt(0, 1)).toBe(0);
    expect(avgPoolAt(1, 0)).toBe(0);
    expect(avgPoolAt(1, 1)).toBe(1);
  });

  it("produces a 2x2 output from a 4x4 input with a 2x2 stride-2 window", () => {
    expect(OUTPUT_SIZE).toBe(2);
    expect(MAX_POOLED).toHaveLength(2);
    expect(MAX_POOLED[0]).toHaveLength(2);
  });

  it("matches the hand-derived max-pooled grid", () => {
    expect(MAX_POOLED).toEqual([
      [6, 0],
      [0, 4],
    ]);
  });

  it("matches the hand-derived average-pooled grid", () => {
    expect(AVG_POOLED).toEqual([
      [3, 0],
      [0, 1],
    ]);
  });

  it("shows max pooling preserves the strongest detection exactly, average dilutes it", () => {
    expect(Math.max(...FEATURE_MAP.flat())).toBe(MAX_POOLED[0][0]);
    expect(AVG_POOLED[0][0]).toBeLessThan(MAX_POOLED[0][0]);
  });
});
