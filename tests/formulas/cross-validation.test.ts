import { describe, it, expect } from "vitest";
import { runKFoldCV, meanMSE, stdevMSE, singleSplitMSE, foldIndices, XS, YS, K } from "@/lib/math-core/cross-validation";

describe("cross-validation", () => {
  it("has one anomalous point at x=6", () => {
    expect(YS[XS.indexOf(6)]).toBe(30);
    expect(YS.filter((y, i) => XS[i] !== 6).every((y, i) => y === 2 * XS.filter((x) => x !== 6)[i] + 1)).toBe(true);
  });

  it("splits into 5 contiguous folds of 2", () => {
    const folds = foldIndices();
    expect(folds).toHaveLength(K);
    expect(folds.every((f) => f.length === 2)).toBe(true);
    expect(folds.flat()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("the fold holding out the anomaly (x=5,6) scores far worse than the others", () => {
    const results = runKFoldCV();
    expect(results[2].testIndices).toEqual([4, 5]);
    expect(results[2].mse).toBeCloseTo(144.5, 5);
    expect(results[1].mse).toBeCloseTo(4.515625, 5);
    expect(results[0].mse).toBeCloseTo(9.850410997732421, 5);
    expect(results[3].mse).toBeCloseTo(7.386670524691363, 5);
    expect(results[4].mse).toBeCloseTo(26.725127551020414, 5);
  });

  it("mean and stdev capture the instability a single number would hide", () => {
    const results = runKFoldCV();
    expect(meanMSE(results)).toBeCloseTo(38.59556681468884, 5);
    expect(stdevMSE(results)).toBeCloseTo(59.829712353662494, 5);
  });

  it("a single 80/20 split happens to land on exactly one fold's result", () => {
    expect(singleSplitMSE()).toBeCloseTo(26.725127551020414, 5);
    const results = runKFoldCV();
    expect(singleSplitMSE()).toBeCloseTo(results[4].mse, 10);
  });
});
