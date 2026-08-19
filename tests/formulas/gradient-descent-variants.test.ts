import { describe, it, expect } from "vitest";
import { sumSquaredError } from "@/lib/math-core/linear-regression";
import { VARIANTS_DATA_POINTS, sseGradient } from "@/lib/math-core/gradient-descent-variants";

describe("VARIANTS_DATA_POINTS and its loss surface", () => {
  it("has SSE ≈ 44.27 at the (0,0) starting point", () => {
    expect(sumSquaredError(VARIANTS_DATA_POINTS, 0, 0)).toBeCloseTo(44.27, 1);
  });

  it("has SSE ≈ 0.259 at the hand-derived least-squares optimum (w=1.97, b=1.02)", () => {
    expect(sumSquaredError(VARIANTS_DATA_POINTS, 1.97, 1.02)).toBeCloseTo(0.259, 2);
  });
});

describe("sseGradient (batch = mean over all 5 points)", () => {
  it("matches the hand-derived mean gradient at (0,0): (-7.88, -2.04)", () => {
    const g = sseGradient(VARIANTS_DATA_POINTS, 0, 0);
    expect(g.w).toBeCloseTo(-7.88, 1);
    expect(g.b).toBeCloseTo(-2.04, 1);
  });

  it("is close to the zero vector at the least-squares optimum", () => {
    const g = sseGradient(VARIANTS_DATA_POINTS, 1.97, 1.02);
    expect(Math.hypot(g.w, g.b)).toBeLessThan(0.5);
  });
});

describe("sseGradient (stochastic and mini-batch subsets)", () => {
  it("matches the worked example: the point (-2,-3.2) alone gives (-12.8, 6.4) at (0,0)", () => {
    const g = sseGradient([VARIANTS_DATA_POINTS[0]], 0, 0);
    expect(g.w).toBeCloseTo(-12.8);
    expect(g.b).toBeCloseTo(6.4);
  });

  it("a single point's gradient generally differs from the full-batch gradient — that's the noise", () => {
    const batch = sseGradient(VARIANTS_DATA_POINTS, 0, 0);
    const stochastic = sseGradient([VARIANTS_DATA_POINTS[0]], 0, 0);
    expect(stochastic.w).not.toBeCloseTo(batch.w, 1);
  });

  it("the batch (mean) gradient is exactly the average of every individual point's own gradient", () => {
    const batch = sseGradient(VARIANTS_DATA_POINTS, 0.5, 0.5);
    const individualSum = VARIANTS_DATA_POINTS.reduce(
      (sum, p) => {
        const g = sseGradient([p], 0.5, 0.5);
        return { w: sum.w + g.w, b: sum.b + g.b };
      },
      { w: 0, b: 0 },
    );
    const averaged = { w: individualSum.w / VARIANTS_DATA_POINTS.length, b: individualSum.b / VARIANTS_DATA_POINTS.length };
    expect(averaged.w).toBeCloseTo(batch.w);
    expect(averaged.b).toBeCloseTo(batch.b);
  });

  it("a two-point mini-batch gradient is exactly the average of its two single-point gradients (so it sits between them)", () => {
    const g0 = sseGradient([VARIANTS_DATA_POINTS[0]], 0, 0).w;
    const g1 = sseGradient([VARIANTS_DATA_POINTS[1]], 0, 0).w;
    const miniBatch = sseGradient([VARIANTS_DATA_POINTS[0], VARIANTS_DATA_POINTS[1]], 0, 0).w;
    expect(miniBatch).toBeCloseTo((g0 + g1) / 2);
    const lo = Math.min(g0, g1);
    const hi = Math.max(g0, g1);
    expect(miniBatch).toBeGreaterThanOrEqual(lo);
    expect(miniBatch).toBeLessThanOrEqual(hi);
  });
});
