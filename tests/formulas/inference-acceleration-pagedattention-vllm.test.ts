import { describe, expect, it } from "vitest";
import {
  CACHE_CAPACITY,
  SEQUENCE_LENGTHS,
  NAIVE_RESERVATION,
  PAGE_SIZE,
  totalUsedTokens,
  naiveTotalAllocated,
  pagedTotalAllocated,
  wastedSlots,
  fragmentationFraction,
  naiveGrid,
  pagedGrid,
  CHECKPOINT_LENGTHS,
} from "@/lib/math-core/inference-acceleration-pagedattention-vllm";

describe("inference-acceleration-pagedattention-vllm", () => {
  it("three sequences use 7 tokens total", () => {
    expect(totalUsedTokens()).toBe(7);
  });

  it("the naive scheme reserves a fixed block per sequence, wasting 5 of 12 slots", () => {
    expect(naiveTotalAllocated()).toBe(SEQUENCE_LENGTHS.length * NAIVE_RESERVATION);
    expect(naiveTotalAllocated()).toBe(12);
    expect(wastedSlots(naiveTotalAllocated(), totalUsedTokens())).toBe(5);
    expect(fragmentationFraction(naiveTotalAllocated(), totalUsedTokens())).toBeCloseTo(5 / 12, 10);
  });

  it("paging allocates only whole pages per sequence, wasting just 1 of 8 slots", () => {
    expect(pagedTotalAllocated()).toBe(8);
    expect(wastedSlots(pagedTotalAllocated(), totalUsedTokens())).toBe(1);
    expect(fragmentationFraction(pagedTotalAllocated(), totalUsedTokens())).toBeCloseTo(0.125, 10);
  });

  it("both grid layouts fill the whole cache and never over-allocate", () => {
    expect(naiveGrid()).toHaveLength(CACHE_CAPACITY);
    expect(pagedGrid()).toHaveLength(CACHE_CAPACITY);
    expect(naiveGrid().filter((c) => c.status !== "free")).toHaveLength(12);
    expect(pagedGrid().filter((c) => c.status !== "free")).toHaveLength(8);
  });

  it("a page holds PAGE_SIZE tokens, and the last page of a sequence can be partly wasted", () => {
    const grid = pagedGrid();
    const seq0Cells = grid.filter((c) => c.seq === 0);
    expect(seq0Cells).toHaveLength(PAGE_SIZE);
    expect(seq0Cells.filter((c) => c.status === "used")).toHaveLength(1);
    expect(seq0Cells.filter((c) => c.status === "wasted")).toHaveLength(1);
  });

  it("an unseen pair of sequences has an exact paged waste under the same page size", () => {
    expect(pagedTotalAllocated(CHECKPOINT_LENGTHS)).toBe(6);
    expect(wastedSlots(pagedTotalAllocated(CHECKPOINT_LENGTHS), totalUsedTokens(CHECKPOINT_LENGTHS))).toBe(2);
  });
});
