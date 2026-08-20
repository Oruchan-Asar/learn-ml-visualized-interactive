import { describe, expect, it } from "vitest";
import { fitTrend, fitSeason, residuals, forecast, trueTrend, trueSeason, TIMES, SERIES } from "@/lib/math-core/time-series-forecasting";

describe("fitting the trend directly on the raw series", () => {
  it("recovers the exact true slope (2) and intercept (10) — the season is orthogonal to it", () => {
    const fit = fitTrend();
    expect(fit.slope).toBeCloseTo(2, 10);
    expect(fit.intercept).toBeCloseTo(10, 10);
  });

  it("the fitted trend matches the true trend at every observed time", () => {
    const fit = fitTrend();
    for (const t of TIMES) {
      expect(fit.intercept + fit.slope * t).toBeCloseTo(trueTrend(t), 10);
    }
  });
});

describe("residuals recover the season exactly", () => {
  it("every residual equals the true seasonal value at that time", () => {
    const fit = fitTrend();
    const resid = residuals(fit);
    TIMES.forEach((t, i) => {
      expect(resid[i]).toBeCloseTo(trueSeason(t), 10);
    });
  });

  it("the fitted seasonal component is exactly [3, -3, -3, 3]", () => {
    const fit = fitTrend();
    const season = fitSeason(fit);
    expect(season).toEqual([3, -3, -3, 3]);
  });
});

describe("forecasting beyond the observed data", () => {
  it("forecasts for t=8..11 are exactly 29, 25, 27, 35", () => {
    const fit = fitTrend();
    const season = fitSeason(fit);
    expect([8, 9, 10, 11].map((t) => forecast(fit, season, t))).toEqual([29, 25, 27, 35]);
  });

  it("the series itself sums trend and season exactly at every observed point", () => {
    TIMES.forEach((t, i) => {
      expect(trueTrend(t) + trueSeason(t)).toBe(SERIES[i]);
    });
  });
});
