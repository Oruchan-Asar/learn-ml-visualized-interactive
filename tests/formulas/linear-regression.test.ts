import { describe, it, expect } from "vitest";
import { DATA_POINTS, predict, sumSquaredError, meanSquaredError } from "@/lib/math-core/linear-regression";

describe("predict", () => {
  it("computes wx + b", () => {
    expect(predict(2, 1, 3)).toBeCloseTo(7);
    expect(predict(0, 5, 100)).toBeCloseTo(5);
  });
});

describe("sumSquaredError on the chapter's dataset", () => {
  it("matches the least-squares optimum: w=1.92, b=1.3 → SSE ≈ 0.524", () => {
    // Hand-derived via the normal equations: Sxy/Sxx and mean_y - w*mean_x.
    expect(sumSquaredError(DATA_POINTS, 1.92, 1.3)).toBeCloseTo(0.524, 2);
  });

  it("is comfortably under the checkpoint's threshold at a clean near-optimal fit (w=2, b=1)", () => {
    expect(sumSquaredError(DATA_POINTS, 2, 1)).toBeCloseTo(0.83, 2);
  });

  it("is far worse for a flat line at the starting height (y=5) than for a good fit", () => {
    const flat = sumSquaredError(DATA_POINTS, 0, 5);
    const good = sumSquaredError(DATA_POINTS, 2, 1);
    expect(flat).toBeGreaterThan(good * 10);
  });

  it("meanSquaredError is sumSquaredError divided by the point count", () => {
    const sse = sumSquaredError(DATA_POINTS, 2, 1);
    expect(meanSquaredError(DATA_POINTS, 2, 1)).toBeCloseTo(sse / DATA_POINTS.length);
  });
});
