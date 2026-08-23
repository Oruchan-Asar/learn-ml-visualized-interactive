import { describe, expect, it } from "vitest";
import {
  ROWS,
  CATEGORIES,
  ordinalEncode,
  oneHotEncode,
  naiveTargetEncode,
  leaveOneOutTargetEncode,
  globalMean,
  SF_ROW_INDEX,
} from "@/lib/math-core/encoding-categorical-variables";

describe("ordinal encoding assigns an arbitrary integer per category", () => {
  it("maps LA/NYC/SF to 0/1/2 by alphabetical order", () => {
    expect(ordinalEncode()).toEqual([1, 0, 1, 2, 0, 1]);
  });

  it("SF (2) is numerically 'greater than' NYC (1) and LA (0) — an ordering with no real meaning", () => {
    const encoded = ordinalEncode();
    expect(encoded[SF_ROW_INDEX]).toBeGreaterThan(encoded[0]);
  });
});

describe("one-hot encoding gives each category its own binary column", () => {
  it("has exactly one 1 per row, aligned to CATEGORIES", () => {
    const encoded = oneHotEncode();
    encoded.forEach((row) => {
      expect(row.reduce((a, b) => a + b, 0)).toBe(1);
    });
    expect(encoded[SF_ROW_INDEX]).toEqual([0, 0, 1]); // LA, NYC, SF
  });

  it("has one column per category", () => {
    expect(oneHotEncode()[0]).toHaveLength(CATEGORIES.length);
  });
});

describe("naive target encoding leaks the label for a singleton category", () => {
  it("NYC (3 rows, labels 1,1,0) encodes to 2/3 for every NYC row", () => {
    const encoded = naiveTargetEncode();
    expect(encoded[0]).toBeCloseTo(2 / 3, 10);
    expect(encoded[2]).toBeCloseTo(2 / 3, 10);
    expect(encoded[5]).toBeCloseTo(2 / 3, 10);
  });

  it("LA (2 rows, labels 0,0) encodes to exactly 0", () => {
    const encoded = naiveTargetEncode();
    expect(encoded[1]).toBe(0);
    expect(encoded[4]).toBe(0);
  });

  it("SF (1 row, label 1) encodes to exactly its own label — total leakage", () => {
    const encoded = naiveTargetEncode();
    expect(encoded[SF_ROW_INDEX]).toBe(ROWS[SF_ROW_INDEX].y);
  });
});

describe("leave-one-out target encoding fixes the leak by excluding the row's own label", () => {
  it("SF has no other SF rows, so it falls back to the global mean (0.5), not its own label (1)", () => {
    const encoded = leaveOneOutTargetEncode();
    expect(encoded[SF_ROW_INDEX]).toBe(globalMean());
    expect(encoded[SF_ROW_INDEX]).not.toBe(ROWS[SF_ROW_INDEX].y);
  });

  it("an NYC row excludes its own label: row index 5 (label 0) sees the other two NYC labels (1,1) → 1.0", () => {
    const encoded = leaveOneOutTargetEncode();
    expect(encoded[5]).toBe(1);
  });

  it("global mean across all 6 labels (1,0,1,1,0,0) is exactly 0.5", () => {
    expect(globalMean()).toBe(0.5);
  });
});
