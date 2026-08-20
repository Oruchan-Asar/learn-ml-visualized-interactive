import { describe, it, expect } from "vitest";
import { convolveAt, FEATURE_MAP, FEATURE_MAP_SIZE, MAX_RESPONSE } from "@/lib/math-core/convolution";

describe("convolveAt, hand-derived at specific positions", () => {
  it("is 0 in the flat dark region (col=0), since the kernel sees no edge", () => {
    expect(convolveAt(0, 0)).toBe(0);
  });

  it("is exactly 3 straddling the edge (col=1): (-1*0+0*0+1*1)*3 rows", () => {
    expect(convolveAt(0, 1)).toBe(3);
    expect(convolveAt(2, 1)).toBe(3);
  });

  it("is exactly 3 at col=2 too — the edge still falls inside this window", () => {
    expect(convolveAt(0, 2)).toBe(3);
  });

  it("is 0 again in the flat light region (col=3), since the kernel sees no edge there either", () => {
    expect(convolveAt(0, 3)).toBe(0);
  });
});

describe("the full feature map forms a clean two-column ridge", () => {
  it("every row has the pattern [0, 3, 3, 0]", () => {
    for (const row of FEATURE_MAP) {
      expect(row).toEqual([0, 3, 3, 0]);
    }
  });

  it("has the expected size (4x4)", () => {
    expect(FEATURE_MAP).toHaveLength(FEATURE_MAP_SIZE);
    expect(FEATURE_MAP[0]).toHaveLength(FEATURE_MAP_SIZE);
  });

  it("the maximum response is exactly 3, achieved at 8 of the 16 positions", () => {
    expect(MAX_RESPONSE).toBe(3);
    const maxCount = FEATURE_MAP.flat().filter((v) => v === MAX_RESPONSE).length;
    expect(maxCount).toBe(8);
  });
});
