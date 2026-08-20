/**
 * Synthetic series over 2 full 4-step seasonal cycles: a linear trend (2t + 10) plus a repeating
 * season [3, -3, -3, 3], chosen so the season is exactly orthogonal to the trend over these 8 points
 * — ordinary least squares recovers the trend exactly, uncontaminated by the season riding on top of it.
 */
export const PERIOD = 4;
export const TRUE_SEASON: number[] = [3, -3, -3, 3];
export const TRUE_SLOPE = 2;
export const TRUE_INTERCEPT = 10;

export function trueTrend(t: number): number {
  return TRUE_SLOPE * t + TRUE_INTERCEPT;
}

export function trueSeason(t: number): number {
  return TRUE_SEASON[t % PERIOD];
}

export const TIMES: number[] = [0, 1, 2, 3, 4, 5, 6, 7];
export const SERIES: number[] = TIMES.map((t) => trueTrend(t) + trueSeason(t));

export interface TrendFit {
  slope: number;
  intercept: number;
}

/** Ordinary least squares, fit directly on the raw (trend + season) series. */
export function fitTrend(times: number[] = TIMES, series: number[] = SERIES): TrendFit {
  const n = times.length;
  const meanT = times.reduce((s, t) => s + t, 0) / n;
  const meanY = series.reduce((s, y) => s + y, 0) / n;
  const num = times.reduce((s, t, i) => s + (t - meanT) * (series[i] - meanY), 0);
  const den = times.reduce((s, t) => s + (t - meanT) ** 2, 0);
  const slope = num / den;
  const intercept = meanY - slope * meanT;
  return { slope, intercept };
}

export function predictTrend(fit: TrendFit, t: number): number {
  return fit.intercept + fit.slope * t;
}

/** Residuals left over after subtracting the fitted trend — this is where the season lives. */
export function residuals(fit: TrendFit, times: number[] = TIMES, series: number[] = SERIES): number[] {
  return times.map((t, i) => series[i] - predictTrend(fit, t));
}

/** The seasonal component: average residual per phase, across every cycle that phase appears in. */
export function fitSeason(fit: TrendFit, times: number[] = TIMES, series: number[] = SERIES): number[] {
  const resid = residuals(fit, times, series);
  const season = new Array(PERIOD).fill(0);
  const counts = new Array(PERIOD).fill(0);
  times.forEach((t, i) => {
    season[t % PERIOD] += resid[i];
    counts[t % PERIOD] += 1;
  });
  return season.map((sum, i) => sum / counts[i]);
}

/** Forecast a future time step: fitted trend plus the fitted seasonal component for its phase. */
export function forecast(fit: TrendFit, season: number[], t: number): number {
  return predictTrend(fit, t) + season[t % PERIOD];
}
