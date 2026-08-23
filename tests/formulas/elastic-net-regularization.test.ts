import { describe, it, expect } from "vitest";
import { elasticNetFit, LAMBDA } from "@/lib/math-core/elastic-net-regularization";
import { lassoFit } from "@/lib/math-core/lasso-regression-l1";

describe("alpha=1 collapses ElasticNet exactly onto lasso's update rule", () => {
  it("matches lassoFit at the same lambda, including the exact zero", () => {
    const elastic = elasticNetFit(1, LAMBDA);
    const lasso = lassoFit(LAMBDA);
    expect(elastic.w1).toBeCloseTo(lasso.w1, 6);
    expect(elastic.w2).toBe(0);
    expect(lasso.w2).toBe(0);
  });
});

describe("alpha=0 never produces an exact zero — the L2-only end of the mix", () => {
  it("both weights stay comfortably nonzero and close together", () => {
    const w = elasticNetFit(0, LAMBDA);
    expect(w.w1).not.toBe(0);
    expect(w.w2).not.toBe(0);
    expect(Math.abs(w.w1 - w.w2)).toBeLessThan(0.15);
  });
});

describe("sweeping alpha from 1 down to 0 smoothly revives the zeroed weight — the grouping effect", () => {
  it("w2 grows from exactly 0 at alpha=1 to a substantial positive value at alpha=0", () => {
    const values = [1, 0.9, 0.75, 0.5, 0.25, 0].map((alpha) => elasticNetFit(alpha, LAMBDA).w2);
    expect(values[0]).toBe(0);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
    }
    expect(values[values.length - 1]).toBeGreaterThan(0.9);
  });
});
