import { describe, it, expect } from "vitest";
import {
  N,
  BLOCK,
  Q,
  K,
  V,
  scoreMatrix,
  naiveAttention,
  flashAttention,
  TILE_ORDER,
  NUM_STEPS,
  tileAt,
  SEQUENCE_LENGTHS,
  naivePeakMemory,
  tiledPeakMemory,
} from "@/lib/math-core/flash-attention-algorithms";

describe("scoreMatrix", () => {
  it("matches the hand-computed 4x4 score matrix", () => {
    expect(scoreMatrix(Q, K)).toEqual([
      [1, 1, 1, 1],
      [1, 0, 1, 0],
      [0, 1, 0, 1],
      [1, -1, 1, -1],
    ]);
  });
});

describe("naiveAttention", () => {
  it("matches the hand-computed exact output for row 0 — all four scores tie, so softmax is exactly uniform", () => {
    const out = naiveAttention(Q, K, V);
    expect(out[0][0]).toBeCloseTo(2.25, 10);
    expect(out[0][1]).toBeCloseTo(1.0, 10);
  });
});

describe("flashAttention", () => {
  it("matches naiveAttention's row 0 exactly, despite never seeing more than one block at a time", () => {
    const naive = naiveAttention(Q, K, V);
    const flash = flashAttention(Q, K, V, BLOCK);
    expect(flash[0][0]).toBeCloseTo(naive[0][0], 9);
    expect(flash[0][1]).toBeCloseTo(naive[0][1], 9);
  });

  it("matches naiveAttention on every row, for a non-uniform row too", () => {
    const naive = naiveAttention(Q, K, V);
    const flash = flashAttention(Q, K, V, BLOCK);
    for (let i = 0; i < N; i++) {
      for (let d = 0; d < naive[i].length; d++) {
        expect(flash[i][d]).toBeCloseTo(naive[i][d], 9);
      }
    }
  });

  it("still matches naive attention with a block size of 1 (the most extreme tiling)", () => {
    const naive = naiveAttention(Q, K, V);
    const flash = flashAttention(Q, K, V, 1);
    for (let i = 0; i < N; i++) {
      for (let d = 0; d < naive[i].length; d++) {
        expect(flash[i][d]).toBeCloseTo(naive[i][d], 9);
      }
    }
  });
});

describe("tileAt", () => {
  it("splits the 4x4 score matrix into four 2x2 tiles in (query-block, key-block) order", () => {
    expect(NUM_STEPS).toBe(4);
    expect(TILE_ORDER).toEqual([
      { qBlock: 0, kBlock: 0 },
      { qBlock: 0, kBlock: 1 },
      { qBlock: 1, kBlock: 0 },
      { qBlock: 1, kBlock: 1 },
    ]);
  });

  it("matches the hand-computed tile at step 2 (query-block 1, key-block 0)", () => {
    const tile = tileAt(2, Q, K);
    expect(tile.rows).toEqual([2, 3]);
    expect(tile.cols).toEqual([0, 1]);
    expect(tile.scores).toEqual([
      [0, 1],
      [1, -1],
    ]);
  });
});

describe("peak memory", () => {
  it("matches the hand-computed values at n = 4: naive holds all 16 scores, tiled holds only 4", () => {
    expect(naivePeakMemory(4)).toBe(16);
    expect(tiledPeakMemory(BLOCK)).toBe(4);
  });

  it("naive peak memory grows quadratically with sequence length, while tiled stays flat", () => {
    const naive = SEQUENCE_LENGTHS.map((n) => naivePeakMemory(n));
    const tiled = SEQUENCE_LENGTHS.map(() => tiledPeakMemory(BLOCK));
    for (let i = 1; i < naive.length; i++) expect(naive[i]).toBeGreaterThan(naive[i - 1]);
    for (const t of tiled) expect(t).toBe(tiled[0]);
  });
});
